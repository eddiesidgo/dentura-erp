package com.dentura.api.role.dto;

import com.dentura.api.role.Permission;

public record PermissionResponse(Long id, String code, String name, String description) {

	public static PermissionResponse from(Permission permission) {
		return new PermissionResponse(
				permission.getId(),
				permission.getCode(),
				permission.getName(),
				permission.getDescription());
	}
}
