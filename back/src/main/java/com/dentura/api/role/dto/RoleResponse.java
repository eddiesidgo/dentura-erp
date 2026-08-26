package com.dentura.api.role.dto;

import java.util.List;

import com.dentura.api.role.Permission;
import com.dentura.api.role.Role;

public record RoleResponse(
		Long id,
		String code,
		String name,
		String description,
		boolean systemRole,
		List<Long> permissionIds) {

	public static RoleResponse from(Role role) {
		return new RoleResponse(
				role.getId(),
				role.getCode(),
				role.getName(),
				role.getDescription(),
				role.isSystemRole(),
				role.getPermissions().stream().map(Permission::getId).toList());
	}
}
