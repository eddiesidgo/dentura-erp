package com.dentura.api.role.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

public record UpdateClinicUserRequest(
		List<Long> roleIds,
		Boolean active,
		@Size(min = 6, max = 100) String password) {
}
