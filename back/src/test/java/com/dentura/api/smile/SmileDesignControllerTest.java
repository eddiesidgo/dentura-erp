package com.dentura.api.smile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SmileDesignControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void createUpdateSuggestExportAndDelete() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Sofia", "Smile");

		MvcResult created = mockMvc.perform(post("/api/smile-designs")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "patientId": %d,
						  "name": "Diseño inicial",
						  "designJson": "{\\"style\\":\\"OVAL\\",\\"teeth\\":[]}",
						  "notes": "Prueba"
						}
						""".formatted(patientId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Diseño inicial"))
				.andExpect(jsonPath("$.status").value("DRAFT"))
				.andExpect(jsonPath("$.version").value(1))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/patients/{patientId}/smile-designs", patientId)
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1));

		mockMvc.perform(put("/api/smile-designs/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "patientId": %d,
						  "name": "Diseño v2",
						  "designJson": "{\\"style\\":\\"HOLLYWOOD\\",\\"teeth\\":[]}"
						}
						""".formatted(patientId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Diseño v2"))
				.andExpect(jsonPath("$.version").value(2));

		mockMvc.perform(post("/api/patients/{patientId}/smile-designs/suggest", patientId)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"style":"OVAL","archWidth":50,"toothLength":11}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.style").value("OVAL"))
				.andExpect(jsonPath("$.teeth").isArray())
				.andExpect(jsonPath("$.suggestedBy").value("rules-v1"));

		String stl = """
				solid dentura
				  facet normal 0 0 1
				    outer loop
				      vertex 0 0 0
				      vertex 1 0 0
				      vertex 0 1 0
				    endloop
				  endfacet
				endsolid dentura
				""";
		MockMultipartFile export = new MockMultipartFile(
				"file",
				"design.stl",
				"model/stl",
				stl.getBytes());

		mockMvc.perform(multipart("/api/smile-designs/{id}/export", id)
				.file(export)
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("EXPORTED"))
				.andExpect(jsonPath("$.hasExport").value(true));

		mockMvc.perform(get("/api/smile-designs/{id}/export", id).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "model/stl"));

		mockMvc.perform(delete("/api/smile-designs/{id}", id).header("Authorization", token))
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
