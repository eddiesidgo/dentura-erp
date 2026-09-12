package com.dentura.api.medication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicationRequest(
		@NotBlank(message = "El código es obligatorio") @Size(max = 20) String code,
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 160) String name,
		@Size(max = 80) String form,
		@Size(max = 80) String dose,
		@Size(max = 80) String frequency,
		@Size(max = 80) String duration,
		String instructions,
		Boolean active,
		Integer sortOrder) {

	public MedicationRequest {
		code = blankToNull(code) == null ? null : blankToNull(code).toUpperCase();
		name = blankToNull(name);
		form = blankToNull(form);
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
