package com.dentura.api.report;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
class ReportControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void summaryPdfWithoutTokenReturns401() throws Exception {
		mockMvc.perform(get("/api/reports/works/summary.pdf"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void summaryPdfWithTokenReturnsPdf() throws Exception {
		mockMvc.perform(get("/api/reports/works/summary.pdf")
				.header("Authorization", bearer()))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.APPLICATION_PDF))
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("trabajos-resumen.pdf")));
	}

	@Test
	void summaryJsonWithTokenReturnsDocument() throws Exception {
		mockMvc.perform(get("/api/reports/works/summary.json")
				.header("Authorization", bearer()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reportType").value("WORKS_SUMMARY"))
				.andExpect(jsonPath("$.clinic.name").isString())
				.andExpect(jsonPath("$.title").value("Resumen por estado"));
	}

	@Test
	void paymentsSummaryAndReferralsReportsReturnDocuments() throws Exception {
		String token = bearer();
		mockMvc.perform(get("/api/reports/payments/summary.json")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reportType").value("PAYMENTS_SUMMARY"))
				.andExpect(jsonPath("$.summaryRows").isArray());

		mockMvc.perform(get("/api/reports/referrals/by-source.json")
				.header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reportType").value("REFERRALS_BY_SOURCE"))
				.andExpect(jsonPath("$.genericRows").isArray());
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
