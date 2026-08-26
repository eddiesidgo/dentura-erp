package com.dentura.api.appointment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AppointmentControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void listWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/appointments")
				.param("from", "2026-08-01T00:00:00Z")
				.param("to", "2026-09-01T00:00:00Z"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createRequiresPatientAndTimeRange() throws Exception {
		mockMvc.perform(post("/api/appointments")
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"reason":"Limpieza"}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void createListsAndDeletesAppointmentForPatient() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Ana María", "López");

		MvcResult created = mockMvc.perform(post("/api/appointments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"startAt": "2026-08-26T15:00:00Z",
							"endAt": "2026-08-26T15:30:00Z",
							"reason": "Limpieza"
						}
						""".formatted(patientId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.patientName").value("López, Ana María"))
				.andExpect(jsonPath("$.status").value("SCHEDULED"))
				.andExpect(jsonPath("$.reason").value("Limpieza"))
				.andReturn();

		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/appointments")
				.param("from", "2026-08-26T00:00:00Z")
				.param("to", "2026-08-27T00:00:00Z")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(get("/api/appointments")
				.param("from", "2026-09-01T00:00:00Z")
				.param("to", "2026-09-02T00:00:00Z")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));

		mockMvc.perform(put("/api/appointments/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"startAt": "2026-08-26T16:00:00Z",
							"endAt": "2026-08-26T16:45:00Z",
							"status": "CONFIRMED",
							"reason": "Control"
						}
						""".formatted(patientId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CONFIRMED"))
				.andExpect(jsonPath("$.reason").value("Control"));

		mockMvc.perform(delete("/api/appointments/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/appointments/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNotFound());
	}

	@Test
	void endBeforeStartReturns400() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Carlos", "Mejía");

		mockMvc.perform(post("/api/appointments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"startAt": "2026-08-26T16:00:00Z",
							"endAt": "2026-08-26T15:00:00Z"
						}
						""".formatted(patientId)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("La hora de fin debe ser posterior al inicio"));
	}

	@Test
	void appointmentsAreIsolatedByClinic() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "María", "Rivas");
		mockMvc.perform(post("/api/appointments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"startAt": "2026-08-26T15:00:00Z",
							"endAt": "2026-08-26T15:30:00Z"
						}
						""".formatted(patientId)))
				.andExpect(status().isCreated());

		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"agenda-norte","name":"Agenda Norte"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();
		long clinicId = objectMapper.readTree(clinic.getResponse().getContentAsString()).get("id").asLong();

		MvcResult switched = mockMvc.perform(post("/api/clinics/{id}/switch", clinicId)
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andReturn();
		String switchedToken = "Bearer " + objectMapper.readTree(switched.getResponse().getContentAsString())
				.get("token").asText();

		mockMvc.perform(get("/api/appointments")
				.param("from", "2026-08-26T00:00:00Z")
				.param("to", "2026-08-27T00:00:00Z")
				.header("Authorization", switchedToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	private long createPatient(String token, String firstName, String lastName) throws Exception {
		MvcResult created = mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"%s","lastName":"%s"}
						""".formatted(firstName, lastName)))
				.andExpect(status().isCreated())
				.andReturn();
		return objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();
	}

	private String bearer() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"admin","password":"123Qwe"}
						"""))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		return "Bearer " + body.get("token").asText();
	}
}
