package com.dentura.api.report.dto;

import java.util.List;

public record ReportDocumentResponse(
		String reportType,
		ReportClinicView clinic,
		String title,
		String subtitle,
		String generatedAt,
		String documentDate,
		String year,
		String emptyMessage,
		List<WorkReportRow> rows,
		List<StatusSummaryRow> summaryRows,
		PatientQuotationResponse quotation) {
}
