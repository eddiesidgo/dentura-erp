package com.dentura.api.auth.dto;

public record AuthResponse(
		String token,
		UserDto user) {
}
