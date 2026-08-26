package com.dentura.api.role.dto;

import java.util.List;

public record ClinicUserRolesResponse(
		Long id,
		String userName,
		String email,
		List<Long> roleIds) {
}
