package com.dentura.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SignInRequest(
		@NotBlank String userName,
		@NotBlank String password) {
}
