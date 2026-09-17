package com.dentura.api.provider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProviderRequest(
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 120) String name,
		@Size(max = 20) String color,
		Long userId,
		Boolean active) {

	public ProviderRequest {
		name = name == null ? null : name.trim();
		color = blankToNull(color);
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
