package com.dentura.api.prescription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PrescriptionTemplateRequest(
		@NotBlank(message = "El medicamento es obligatorio") @Size(max = 160) String drug,
		@Size(max = 80) String dose,
		@Size(max = 80) String frequency,
		@Size(max = 80) String duration,
		String instructions,
		Boolean active) {

	public PrescriptionTemplateRequest {
		drug = blankToNull(drug);
		dose = blankToNull(dose);
		frequency = blankToNull(frequency);
		duration = blankToNull(duration);
		instructions = blankToNull(instructions);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
