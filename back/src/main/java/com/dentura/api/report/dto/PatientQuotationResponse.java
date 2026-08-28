package com.dentura.api.report.dto;

import java.util.List;

import com.dentura.api.report.ReportService;

public record PatientQuotationResponse(
		String recordNumber,
		String patientName,
		String dui,
		String phone,
		List<WorkReportRow> rows,
		String pendingTotal,
		String completedTotal,
		String rejectedTotal,
		String quoteTotal) {

	public static PatientQuotationResponse from(ReportService.PatientQuotation quotation) {
		return new PatientQuotationResponse(
				quotation.recordNumber(),
				quotation.patientName(),
				quotation.dui(),
				quotation.phone(),
				quotation.rows(),
				quotation.pendingTotal(),
				quotation.completedTotal(),
				quotation.rejectedTotal(),
				quotation.quoteTotal());
	}
}
