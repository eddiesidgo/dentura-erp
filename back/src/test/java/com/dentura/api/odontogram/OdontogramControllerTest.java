package com.dentura.api.odontogram;

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
class OdontogramControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void listWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/odontogram").param("patientId", "1"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createListsUpdateAndDeleteEntry() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Ana", "Dental");

		MvcResult created = mockMvc.perform(post("/api/odontogram")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"tooth": "16",
							"surfaces": "MO",
							"condition": "CARIES",
							"status": "EXISTING",
							"notes": "Caries oclusal"
						}
						""".formatted(patientId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.tooth").value("16"))
				.andExpect(jsonPath("$.surfaces").value("MO"))
				.andExpect(jsonPath("$.condition").value("CARIES"))
				.andExpect(jsonPath("$.status").value("EXISTING"))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/odontogram").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(put("/api/odontogram/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"tooth": "16",
							"surfaces": "MOD",
							"condition": "FILLING",
							"status": "COMPLETED"
						}
						""".formatted(patientId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.condition").value("FILLING"))
				.andExpect(jsonPath("$.status").value("COMPLETED"))
				.andExpect(jsonPath("$.surfaces").value("DMO"));

		mockMvc.perform(delete("/api/odontogram/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNoContent());
	}

	@Test
	void invalidToothReturns400() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Carlos", "Molar");

		mockMvc.perform(post("/api/odontogram")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"tooth": "99",
							"condition": "CARIES",
							"status": "EXISTING"
						}
						""".formatted(patientId)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void entriesAreIsolatedByClinic() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "María", "Pieza");
		mockMvc.perform(post("/api/odontogram")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"patientId": %d, "tooth": "11", "condition": "MISSING", "status": "EXISTING"}
						""".formatted(patientId)))
				.andExpect(status().isCreated());

		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"odonto-norte","name":"Odontograma Norte"}
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

		mockMvc.perform(get("/api/odontogram").param("patientId", String.valueOf(patientId))
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
