package com.dentura.api.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateClinicRequest(
		@NotBlank
		@Pattern(regexp = "^[a-z0-9-]{2,40}$", message = "El código debe ser minúsculas, números o guiones")
		String code,
		@NotBlank
		@Size(max = 160)
		String name,
		@Pattern(regexp = "BASIC|MULTI_DOCTOR|FULL", message = "preset debe ser BASIC, MULTI_DOCTOR o FULL")
		String preset) {
}
