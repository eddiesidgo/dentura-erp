package com.dentura.api.role.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RoleRequest(
		@NotBlank
		@Pattern(regexp = "^[a-z0-9-]{2,80}$", message = "El código debe ser minúsculas, números o guiones")
		String code,
		@NotBlank
		@Size(max = 160)
		String name,
		@Size(max = 255)
		String description,
		List<Long> permissionIds) {
}
