package com.dentura.api.prescription;

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
class PrescriptionControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void createListsUpdateAndDeletePrescriptionAndTemplate() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Marta", "Receta");

		MvcResult template = mockMvc.perform(post("/api/prescription-templates")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"drug": "Amoxicilina",
							"dose": "500 mg",
							"frequency": "cada 8 h",
							"duration": "7 días",
							"instructions": "Después de comer"
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.drug").value("Amoxicilina"))
				.andReturn();
		long templateId = objectMapper.readTree(template.getResponse().getContentAsString()).get("id").asLong();

		MvcResult created = mockMvc.perform(post("/api/prescriptions")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"drug": "Amoxicilina",
							"dose": "500 mg",
							"frequency": "cada 8 h",
							"duration": "7 días",
							"templateId": %d,
							"notes": "Control en 1 semana"
						}
						""".formatted(patientId, templateId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.patientId").value(patientId))
				.andExpect(jsonPath("$.templateId").value(templateId))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/prescriptions").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(put("/api/prescriptions/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"drug": "Ibuprofeno",
							"dose": "400 mg",
							"frequency": "cada 8 h",
							"duration": "3 días",
							"templateId": %d
						}
						""".formatted(patientId, templateId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.drug").value("Ibuprofeno"));

		mockMvc.perform(delete("/api/prescriptions/{id}", id).header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(delete("/api/prescription-templates/{id}", templateId).header("Authorization", token))
				.andExpect(status().isNoContent());
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
