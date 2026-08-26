package com.dentura.api.clinic;

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
class ClinicControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void publicIdentityReturnsDefaultClinicTheme() throws Exception {
		mockMvc.perform(get("/api/clinic-identity"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value("default"))
				.andExpect(jsonPath("$.name").isNotEmpty())
				.andExpect(jsonPath("$.themeColor").value("indigo"))
				.andExpect(jsonPath("$.themeMode").value("light"));
	}

	@Test
	void signInIncludesSuperAdminAndActiveClinic() throws Exception {
		mockMvc.perform(post("/api/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"admin","password":"123Qwe"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.authority").value(org.hamcrest.Matchers.hasItem("super_admin")))
				.andExpect(jsonPath("$.user.clinicId").isNumber())
				.andExpect(jsonPath("$.clinic.code").value("default"));
	}

	@Test
	void signedUpUserCannotUpdateClinicIdentity() throws Exception {
		mockMvc.perform(post("/api/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"staff1","email":"staff1@dentura.local","password":"123Qwe"}
						"""))
				.andExpect(status().isOk());

		MvcResult signIn = mockMvc.perform(post("/api/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"staff1","password":"123Qwe"}
						"""))
				.andExpect(status().isOk())
				.andReturn();
		String token = "Bearer " + objectMapper.readTree(signIn.getResponse().getContentAsString())
				.get("token").asText();

		mockMvc.perform(put("/api/clinics/current")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Hack","themeColor":"red","themeMode":"dark"}
						"""))
				.andExpect(status().isForbidden());
	}

	@Test
	void superAdminCanSaveClinicIdentity() throws Exception {
		String token = adminBearer();

		mockMvc.perform(put("/api/clinics/current")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"name":"Clínica Rivera",
							"nit":"0614-000000-000-0",
							"phone":"2222-3333",
							"themeColor":"teal",
							"themeMode":"dark",
							"primaryColorLevel":700,
							"layoutType":"classic"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Clínica Rivera"))
				.andExpect(jsonPath("$.themeColor").value("teal"))
				.andExpect(jsonPath("$.themeMode").value("dark"))
				.andExpect(jsonPath("$.primaryColorLevel").value(700))
				.andExpect(jsonPath("$.layoutType").value("classic"));

		mockMvc.perform(get("/api/clinic-identity"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Clínica Rivera"))
				.andExpect(jsonPath("$.themeColor").value("teal"));
	}

	@Test
	void patientsAreIsolatedBetweenClinics() throws Exception {
		String token = adminBearer();

		mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Ana","lastName":"López","dui":"22222222-2"}
						"""))
				.andExpect(status().isCreated());

		MvcResult createdClinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"norte","name":"Clínica Norte"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.code").value("norte"))
				.andReturn();
		long clinicId = objectMapper.readTree(createdClinic.getResponse().getContentAsString()).get("id").asLong();

		MvcResult switched = mockMvc.perform(post("/api/clinics/{id}/switch", clinicId)
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.clinic.code").value("norte"))
				.andReturn();
		String norteToken = "Bearer " + objectMapper.readTree(switched.getResponse().getContentAsString())
				.get("token").asText();

		mockMvc.perform(get("/api/patients").header("Authorization", norteToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));

		mockMvc.perform(post("/api/patients")
				.header("Authorization", norteToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Ana","lastName":"López","dui":"22222222-2"}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/patients").header("Authorization", norteToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));

		mockMvc.perform(get("/api/patients").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.data[0].firstName").value("Ana"));
	}

	@Test
	void nonSuperAdminCannotSwitchClinic() throws Exception {
		String adminToken = adminBearer();
		MvcResult createdClinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"sur","name":"Clínica Sur"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();
		long clinicId = objectMapper.readTree(createdClinic.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(post("/api/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"staff2","email":"staff2@dentura.local","password":"123Qwe"}
						"""))
				.andExpect(status().isOk());
		MvcResult signIn = mockMvc.perform(post("/api/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"staff2","password":"123Qwe"}
						"""))
				.andExpect(status().isOk())
				.andReturn();
		String staffToken = "Bearer " + objectMapper.readTree(signIn.getResponse().getContentAsString())
				.get("token").asText();

		mockMvc.perform(post("/api/clinics/{id}/switch", clinicId)
				.header("Authorization", staffToken))
				.andExpect(status().isForbidden());
	}

	private String adminBearer() throws Exception {
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
