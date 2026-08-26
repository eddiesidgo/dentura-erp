package com.dentura.api.auth.dto;

import com.dentura.api.clinic.dto.ClinicIdentityResponse;

public record AuthResponse(
		String token,
		UserDto user,
		ClinicIdentityResponse clinic) {
}
