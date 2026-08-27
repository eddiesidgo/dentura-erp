package com.dentura.api.work.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

public record WorkRequest(
		@NotNull(message = "El paciente es obligatorio") Long patientId,
		@NotNull(message = "El tratamiento es obligatorio") Long treatmentId,
		String status,
		Integer quantity,
		BigDecimal unitPrice,
		String tooth,
		String notes) {

	public WorkRequest {
		status = blankToNull(status);
		tooth = blankToNull(tooth);
		notes = blankToNull(notes);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
