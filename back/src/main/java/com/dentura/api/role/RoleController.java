package com.dentura.api.role;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.role.dto.AssignRolesRequest;
import com.dentura.api.role.dto.ClinicUserRolesResponse;
import com.dentura.api.role.dto.PermissionResponse;
import com.dentura.api.role.dto.RoleRequest;
import com.dentura.api.role.dto.RoleResponse;

import jakarta.validation.Valid;

@RestController
public class RoleController {

	private final RoleService roleService;
	private final PermissionService permissionService;

	public RoleController(RoleService roleService, PermissionService permissionService) {
		this.roleService = roleService;
		this.permissionService = permissionService;
	}

	@GetMapping("/api/permissions")
	public List<PermissionResponse> permissions() {
		return permissionService.catalog();
	}

	@GetMapping("/api/roles")
	public List<RoleResponse> list() {
		return roleService.list();
	}

	@PostMapping("/api/roles")
	public ResponseEntity<RoleResponse> create(@Valid @RequestBody RoleRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
	}

	@PutMapping("/api/roles/{id}")
	public RoleResponse update(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
		return roleService.update(id, request);
	}

	@DeleteMapping("/api/roles/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		roleService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/api/roles/users")
	public List<ClinicUserRolesResponse> users() {
		return roleService.listUsers();
	}

	@PutMapping("/api/roles/users/{userId}")
	public ClinicUserRolesResponse assign(
			@PathVariable Long userId,
			@RequestBody AssignRolesRequest request) {
		return roleService.assignRoles(userId, request);
	}
}
