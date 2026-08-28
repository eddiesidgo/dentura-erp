package com.dentura.api.report.dto;

import java.math.BigDecimal;

public record WorkReportRow(
		String patientName,
		String recordNumber,
		String treatmentCode,
		String treatmentName,
		String status,
		String statusLabel,
		int quantity,
		String unitPrice,
		String total,
		String tooth,
		String createdAt) {

	public static WorkReportRow of(
			String patientName,
			String recordNumber,
			String treatmentCode,
			String treatmentName,
			String status,
			String statusLabel,
			int quantity,
			BigDecimal unitPrice,
			BigDecimal total,
			String tooth,
			String createdAt) {
		return new WorkReportRow(
				patientName,
				recordNumber,
				treatmentCode,
				treatmentName,
				status,
				statusLabel,
				quantity,
				com.dentura.api.report.ReportFormat.money(unitPrice),
				com.dentura.api.report.ReportFormat.money(total),
				tooth == null || tooth.isBlank() ? "—" : tooth,
				createdAt);
	}
}
