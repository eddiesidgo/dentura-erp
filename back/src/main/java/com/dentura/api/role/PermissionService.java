package com.dentura.api.role;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.domain.User;
import com.dentura.api.role.dto.PermissionResponse;

@Service
public class PermissionService {

	private final ClinicAccess clinicAccess;
	private final PermissionRepository permissionRepository;
	private final RoleRepository roleRepository;

	public PermissionService(
			ClinicAccess clinicAccess,
			PermissionRepository permissionRepository,
			RoleRepository roleRepository) {
		this.clinicAccess = clinicAccess;
		this.permissionRepository = permissionRepository;
		this.roleRepository = roleRepository;
	}

	@Transactional(readOnly = true)
	public void require(String permissionCode) {
		if (clinicAccess.isSuperAdmin()) {
			return;
		}
		if (!has(permissionCode)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para esta acción");
		}
	}

	@Transactional(readOnly = true)
	public boolean has(String permissionCode) {
		if (clinicAccess.isSuperAdmin()) {
			return true;
		}
		Long clinicId = clinicAccess.requireClinicId();
		Long userId = clinicAccess.currentUser().getUser().getId();
		return roleRepository.findPermissionCodes(userId, clinicId).contains(permissionCode);
	}

	@Transactional(readOnly = true)
	public List<String> codesFor(User user, Long clinicId) {
		List<String> codes = new ArrayList<>();
		if (user.isSuperAdmin()) {
			codes.add("super_admin");
		}
		if (clinicId != null && user.getId() != null) {
			codes.addAll(roleRepository.findPermissionCodes(user.getId(), clinicId));
		}
		return codes.stream().distinct().toList();
	}

	@Transactional(readOnly = true)
	public List<PermissionResponse> catalog() {
		require(Permission.ROLES_MANAGE);
		return permissionRepository.findAll().stream().map(PermissionResponse::from).toList();
	}
}
