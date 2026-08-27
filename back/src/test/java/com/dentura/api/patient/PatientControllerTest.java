package com.dentura.api.patient;

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
class PatientControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void listWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/patients"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createWithoutFirstNameReturns400() throws Exception {
		mockMvc.perform(post("/api/patients")
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"lastName":"López"}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void createGeneratesRecordNumberAndListFindsPatient() throws Exception {
		MvcResult created = mockMvc.perform(post("/api/patients")
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"firstName":"Ana María",
							"lastName":"López",
							"sex":"FEMALE",
							"dateOfBirth":"1990-05-12",
							"mobile":"7777-8888",
							"dui":"01234567-8",
							"nit":"0614-120590-101-2"
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.recordNumber").value(org.hamcrest.Matchers.matchesPattern("P-\\d{6}")))
				.andExpect(jsonPath("$.firstName").value("Ana María"))
				.andExpect(jsonPath("$.lastName").value("López"))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();

		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/patients").param("q", "López")
				.header("Authorization", bearer()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.pageIndex").value(1))
				.andExpect(jsonPath("$.data[0].id").value(id))
				.andExpect(jsonPath("$.data[0].mobile").value("7777-8888"));

		mockMvc.perform(get("/api/patients/{id}", id)
				.header("Authorization", bearer()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.dui").value("01234567-8"));
	}

	@Test
	void updateAndDeletePatient() throws Exception {
		MvcResult created = mockMvc.perform(post("/api/patients")
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Carlos","lastName":"Mejía"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();

		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(put("/api/patients/{id}", id)
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Carlos","lastName":"Mejía","phone":"2222-1111","city":"San Salvador"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.phone").value("2222-1111"))
				.andExpect(jsonPath("$.city").value("San Salvador"));

		mockMvc.perform(delete("/api/patients/{id}", id)
				.header("Authorization", bearer()))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/patients/{id}", id)
				.header("Authorization", bearer()))
				.andExpect(status().isNotFound());
	}

	@Test
	void duplicateDuiReturns409() throws Exception {
		String token = bearer();
		mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Ana","lastName":"López","dui":"11111111-1"}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"María","lastName":"Rivas","dui":"11111111-1"}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Ya existe un paciente con ese DUI"));
	}

	@Test
	void kpisReturnsSummary() throws Exception {
		String token = bearer();
		mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Sara","lastName":"Arias"}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/patients/kpis")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalPatients").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
				.andExpect(jsonPath("$.newPatientsThisMonth").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
				.andExpect(jsonPath("$.patientsWithUpcomingAppointment").value(org.hamcrest.Matchers.greaterThanOrEqualTo(0)))
				.andExpect(jsonPath("$.inactivePatients").value(org.hamcrest.Matchers.greaterThanOrEqualTo(0)))
				.andExpect(jsonPath("$.upcomingDays").value(7))
				.andExpect(jsonPath("$.inactivityDays").value(90));
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
