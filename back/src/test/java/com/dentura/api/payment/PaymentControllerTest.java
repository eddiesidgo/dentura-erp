package com.dentura.api.payment;

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
class PaymentControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void createListsUpdateAndDeletePayment() throws Exception {
		String token = bearer();
		long patientId = createPatient(token, "Ana", "Pago");
		long treatmentId = treatmentId(token, "CONS");

		MvcResult work = mockMvc.perform(post("/api/works")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"patientId": %d, "treatmentId": %d, "quantity": 1, "unitPrice": 50, "status": "PENDING"}
						""".formatted(patientId, treatmentId)))
				.andExpect(status().isCreated())
				.andReturn();
		long workId = objectMapper.readTree(work.getResponse().getContentAsString()).get("id").asLong();

		MvcResult created = mockMvc.perform(post("/api/payments")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"amount": 30,
							"method": "CASH",
							"notes": "Abono",
							"allocations": [{"workId": %d, "amount": 30}]
						}
						""".formatted(patientId, workId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.receiptNumber").value(1))
				.andExpect(jsonPath("$.amount").value(30.0))
				.andExpect(jsonPath("$.method").value("CASH"))
				.andExpect(jsonPath("$.allocations.length()").value(1))
				.andReturn();
		long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

		mockMvc.perform(get("/api/payments").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(id));

		mockMvc.perform(get("/api/payments/balance").param("patientId", String.valueOf(patientId))
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.worksTotal").value(50.0))
				.andExpect(jsonPath("$.paidTotal").value(30.0))
				.andExpect(jsonPath("$.balance").value(20.0));

		mockMvc.perform(put("/api/payments/{id}", id)
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
							"patientId": %d,
							"amount": 40,
							"method": "CARD",
							"allocations": [{"workId": %d, "amount": 40}]
						}
						""".formatted(patientId, workId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.method").value("CARD"))
				.andExpect(jsonPath("$.amount").value(40.0));

		mockMvc.perform(delete("/api/payments/{id}", id)
				.header("Authorization", token))
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
