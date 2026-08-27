package com.dentura.api.treatment.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TreatmentRequest(
		@NotBlank(message = "El código es obligatorio") @Size(max = 20) String code,
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 160) String name,
		BigDecimal price,
		Boolean active,
		Integer sortOrder) {

	public TreatmentRequest {
		code = blankToNull(code) == null ? null : blankToNull(code).toUpperCase();
		name = blankToNull(name);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
