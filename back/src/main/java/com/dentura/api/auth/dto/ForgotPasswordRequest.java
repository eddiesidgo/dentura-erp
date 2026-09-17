package com.dentura.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
		@NotBlank String email) {
}
