package com.dentura.api.referral;

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
class ReferralControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void createListsUpdateAndDeleteReferralSourceAndOutbound() throws Exception {
		String token = bearer();

		MvcResult source = mockMvc.perform(post("/api/referral-sources")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Dr. Pérez","type":"PERSON","phone":"2222-1111"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("PERSON"))
				.andReturn();
		long sourceId = objectMapper.readTree(source.getResponse().getContentAsString()).get("id").asLong();

		MvcResult patient = mockMvc.perform(post("/api/patients")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"firstName":"Elena","lastName":"Referida","referralSourceId":%d}
						""".formatted(sourceId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.referralSourceId").value(sourceId))
				.andReturn();
		long patientId = objectMapper.readTree(patient.getResponse().getContentAsString()).get("id").asLong();

		MvcResult created = mockMvc.perform(post("/api/outbound-referrals")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"specialty": "Endodoncia",
							"toName": "Clínica Norte",
							"reason": "Conducto",
							"status": "DRAFT"
						}
						""".formatted(patientId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.specialty").value("Endodoncia"))
				.andExpect(jsonPath("$.status").value("DRAFT"))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/outbound-referrals").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(put("/api/outbound-referrals/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"specialty": "Endodoncia",
							"toName": "Clínica Norte",
							"reason": "Conducto",
							"status": "SENT"
						}
						""".formatted(patientId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("SENT"));

		mockMvc.perform(delete("/api/outbound-referrals/{id}", id).header("Authorization", token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/referral-sources").header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(sourceId));

		mockMvc.perform(delete("/api/referral-sources/{id}", sourceId).header("Authorization", token))
				.andExpect(status().isNoContent());
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
