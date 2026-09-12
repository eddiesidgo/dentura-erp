package com.dentura.api.report.dto;

public record PrescriptionReportResponse(
		String patientName,
		String recordNumber,
		String dui,
		String phone,
		String drug,
		String dose,
		String frequency,
		String duration,
		String instructions,
		String notes,
		String prescribedAt) {
}
