package com.dentura.api.treatment;

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
class TreatmentControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void listWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/treatments"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void seedIncludesGestOdonCodes() throws Exception {
		mockMvc.perform(get("/api/treatments").param("size", "200").header("Authorization", bearer()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(40)))
				.andExpect(jsonPath("$.data[?(@.code=='CONS')].name").value(org.hamcrest.Matchers.hasItem("Consulta")))
				.andExpect(jsonPath("$.data[?(@.code=='PROF')].name").value(org.hamcrest.Matchers.hasItem("Profilaxis")))
				.andExpect(jsonPath("$.data[?(@.code=='CPP')].name")
						.value(org.hamcrest.Matchers.hasItem("Corona Libre de Metal E-Max")));
	}

	@Test
	void createUpdateAndDeleteTreatment() throws Exception {
		String token = bearer();
		MvcResult created = mockMvc.perform(post("/api/treatments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"TEST-X","name":"Tratamiento de prueba","price":25.50}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.code").value("TEST-X"))
				.andExpect(jsonPath("$.name").value("Tratamiento de prueba"))
				.andExpect(jsonPath("$.price").value(25.50))
				.andExpect(jsonPath("$.active").value(true))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(put("/api/treatments/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"TEST-X","name":"Tratamiento editado","price":30,"active":false}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Tratamiento editado"))
				.andExpect(jsonPath("$.active").value(false));

		mockMvc.perform(delete("/api/treatments/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/treatments/{id}", id)
				.header("Authorization", token))
				.andExpect(status().isNotFound());
	}

	@Test
	void duplicateCodeInSameClinicReturns409() throws Exception {
		String token = bearer();
		mockMvc.perform(post("/api/treatments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"DUP-1","name":"Uno"}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/treatments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"dup-1","name":"Dos"}
						"""))
				.andExpect(status().isConflict());
	}

	@Test
	void catalogIsIsolatedByClinic() throws Exception {
		String token = bearer();
		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"catalog-norte","name":"Catálogo Norte"}
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

		mockMvc.perform(get("/api/treatments").header("Authorization", switchedToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[?(@.code=='CONS')]").isNotEmpty());
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
