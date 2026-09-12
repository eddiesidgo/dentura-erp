package com.dentura.api.referral.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReferralSourceRequest(
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 160) String name,
		@NotBlank(message = "El tipo es obligatorio") @Size(max = 20) String type,
		@Size(max = 40) String phone,
		Boolean active) {

	public ReferralSourceRequest {
		name = blankToNull(name);
		type = blankToNull(type);
		phone = blankToNull(phone);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
