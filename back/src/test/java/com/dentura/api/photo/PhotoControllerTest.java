package com.dentura.api.photo;

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
class PhotoControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void uploadListsGetsFileAndDeletesPhoto() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Luis", "Foto");

		MockMultipartFile file = new MockMultipartFile(
				"file",
				"clinic.jpg",
				"image/jpeg",
				new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02});

		MvcResult created = mockMvc.perform(multipart("/api/patients/{patientId}/photos", patientId)
				.file(file)
				.param("category", "CLINICAL")
				.param("caption", "Inicial")
				.header("Authorization", token))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.category").value("CLINICAL"))
				.andExpect(jsonPath("$.caption").value("Inicial"))
				.andExpect(jsonPath("$.fileName").value("clinic.jpg"))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/patients/{patientId}/photos", patientId)
				.param("category", "CLINICAL")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(get("/api/photos/{id}", id).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id));

		mockMvc.perform(get("/api/photos/{id}/file", id).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "image/jpeg"));

		mockMvc.perform(delete("/api/photos/{id}", id).header("Authorization", token))
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
