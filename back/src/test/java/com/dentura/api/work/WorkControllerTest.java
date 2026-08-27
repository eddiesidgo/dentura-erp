package com.dentura.api.work;

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
class WorkControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void listWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/works").param("patientId", "1"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createListsUpdateAndDeleteWork() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Ana", "López");
		long treatmentId = treatmentId(token, "CONS");

		MvcResult created = mockMvc.perform(post("/api/works")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"treatmentId": %d,
							"quantity": 1,
							"unitPrice": 20,
							"status": "PENDING",
							"tooth": "1.6",
							"notes": "Primera visita"
						}
						""".formatted(patientId, treatmentId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.treatmentCode").value("CONS"))
				.andExpect(jsonPath("$.treatmentName").value("Consulta"))
				.andExpect(jsonPath("$.status").value("PENDING"))
				.andExpect(jsonPath("$.tooth").value("1.6"))
				.andExpect(jsonPath("$.total").value(20.0))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/works").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(put("/api/works/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"treatmentId": %d,
							"quantity": 2,
							"unitPrice": 15,
							"status": "COMPLETED",
							"tooth": "1.6"
						}
						""".formatted(patientId, treatmentId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("COMPLETED"))
				.andExpect(jsonPath("$.total").value(30.0));

		mockMvc.perform(delete("/api/works/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNoContent());
	}

	@Test
	void invalidStatusReturns400() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Carlos", "Mejía");
		long treatmentId = treatmentId(token, "PROF");

		mockMvc.perform(post("/api/works")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"treatmentId": %d,
							"status": "PAID"
						}
						""".formatted(patientId, treatmentId)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void worksAreIsolatedByClinic() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "María", "Rivas");
		long treatmentId = treatmentId(token, "CONS");
		mockMvc.perform(post("/api/works")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"patientId": %d, "treatmentId": %d, "status": "PENDING"}
						""".formatted(patientId, treatmentId)))
				.andExpect(status().isCreated());

		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"works-norte","name":"Trabajos Norte"}
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

		mockMvc.perform(get("/api/works").param("patientId", String.valueOf(patientId))
				.header("Authorization", switchedToken))
				.andExpect(status().isNotFound());
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

	private long treatmentId(String token, String code) throws Exception {
		MvcResult list = mockMvc.perform(get("/api/treatments")
				.param("q", code)
				.param("size", "100")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode data = objectMapper.readTree(list.getResponse().getContentAsString()).get("data");
		for (JsonNode item : data) {
			if (code.equals(item.get("code").asText())) {
				return item.get("id").asLong();
			}
		}
		throw new IllegalStateException("Seeded treatment not found: " + code);
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
