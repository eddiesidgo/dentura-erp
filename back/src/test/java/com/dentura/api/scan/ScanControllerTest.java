package com.dentura.api.scan;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class ScanControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void uploadListsGetsFileAndDeletesScan() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Ana", "Scan");

		// Minimal ASCII STL
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

		MockMultipartFile file = new MockMultipartFile(
				"file",
				"upper.stl",
				"model/stl",
				stl.getBytes());

		MvcResult created = mockMvc.perform(multipart("/api/patients/{patientId}/scans", patientId)
				.file(file)
				.param("arch", "UPPER")
				.param("caption", "Arco superior")
				.header("Authorization", token))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.arch").value("UPPER"))
				.andExpect(jsonPath("$.caption").value("Arco superior"))
				.andExpect(jsonPath("$.fileName").value("upper.stl"))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/patients/{patientId}/scans", patientId)
				.param("arch", "UPPER")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(get("/api/scans/{id}", id).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id));

		mockMvc.perform(get("/api/scans/{id}/file", id).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "model/stl"));

		mockMvc.perform(delete("/api/scans/{id}", id).header("Authorization", token))
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
