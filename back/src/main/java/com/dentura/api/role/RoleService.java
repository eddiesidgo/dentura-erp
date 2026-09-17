package com.dentura.api.role;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;
import com.dentura.api.role.dto.AssignRolesRequest;
import com.dentura.api.role.dto.ClinicUserRolesResponse;
import com.dentura.api.role.dto.RoleRequest;
import com.dentura.api.role.dto.RoleResponse;

@Service
public class RoleService {

	private final RoleRepository roleRepository;
	private final PermissionRepository permissionRepository;
	private final UserRepository userRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public RoleService(
			RoleRepository roleRepository,
			PermissionRepository permissionRepository,
			UserRepository userRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.roleRepository = roleRepository;
		this.permissionRepository = permissionRepository;
		this.userRepository = userRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<RoleResponse> list() {
		permissionService.require(Permission.ROLES_MANAGE);
		return roleRepository.findByClinicIdOrderByNameAsc(clinicAccess.requireClinicId()).stream()
				.map(RoleResponse::from)
				.toList();
	}

	@Transactional
	public RoleResponse create(RoleRequest request) {
		permissionService.require(Permission.ROLES_MANAGE);
		Long clinicId = clinicAccess.requireClinicId();
		String code = request.code().trim().toLowerCase();
		if (roleRepository.existsByClinicIdAndCode(clinicId, code)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un rol con ese código en esta clínica");
		}
		Role role = new Role();
		role.setClinicId(clinicId);
		role.setCode(code);
		role.setName(request.name().trim());
		role.setDescription(blankToNull(request.description()));
		role.setSystemRole(false);
		role.setPermissions(loadPermissions(request.permissionIds()));
		return RoleResponse.from(roleRepository.save(role));
	}

	@Transactional
	public RoleResponse update(Long id, RoleRequest request) {
		permissionService.require(Permission.ROLES_MANAGE);
		Role role = requireInClinic(id);
		role.setName(request.name().trim());
		role.setDescription(blankToNull(request.description()));
		role.setPermissions(loadPermissions(request.permissionIds()));
		assertAdminKeepsManage(role);
		return RoleResponse.from(roleRepository.save(role));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.ROLES_MANAGE);
		Role role = requireInClinic(id);
		if (role.isSystemRole()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede eliminar un rol de sistema");
		}
		roleRepository.delete(role);
	}

	@Transactional(readOnly = true)
	public List<ClinicUserRolesResponse> listUsers() {
		permissionService.require(Permission.ROLES_MANAGE);
		Long clinicId = clinicAccess.requireClinicId();
		return userRepository.findByClinicIdOrderByUserNameAsc(clinicId).stream()
				.map(user -> new ClinicUserRolesResponse(
						user.getId(),
						user.getUserName(),
						user.getEmail(),
						user.isActive(),
						user.getRoles().stream()
								.filter(role -> clinicId.equals(role.getClinicId()))
								.map(Role::getId)
								.toList()))
				.toList();
	}

	@Transactional
	public ClinicUserRolesResponse assignRoles(Long userId, AssignRolesRequest request) {
		permissionService.require(Permission.ROLES_MANAGE);
		Long clinicId = clinicAccess.requireClinicId();
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
		if (!clinicId.equals(user.getClinicId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no pertenece a esta clínica");
		}
		Set<Role> assigned = new HashSet<>();
		List<Long> roleIds = request.roleIds() == null ? List.of() : request.roleIds();
		for (Long roleId : roleIds) {
			assigned.add(requireInClinic(roleId));
		}
		Set<Role> kept = new HashSet<>();
		for (Role existing : user.getRoles()) {
			if (!clinicId.equals(existing.getClinicId())) {
				kept.add(existing);
			}
		}
		kept.addAll(assigned);
		user.setRoles(kept);
		userRepository.save(user);
		return new ClinicUserRolesResponse(
				user.getId(),
				user.getUserName(),
				user.getEmail(),
				user.isActive(),
				assigned.stream().map(Role::getId).toList());
	}

	private void assertAdminKeepsManage(Role role) {
		if (!role.isSystemRole() || !"administrador".equals(role.getCode())) {
			return;
		}
		boolean keepsManage = role.getPermissions().stream()
				.anyMatch(permission -> Permission.ROLES_MANAGE.equals(permission.getCode()));
		if (!keepsManage) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"El rol Administrador debe conservar el permiso de asignar roles");
		}
	}

	private Role requireInClinic(Long id) {
		return roleRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));
	}

	private Set<Permission> loadPermissions(List<Long> permissionIds) {
		if (permissionIds == null || permissionIds.isEmpty()) {
			return new HashSet<>();
		}
		List<Permission> found = permissionRepository.findAllById(permissionIds);
		if (found.size() != permissionIds.stream().distinct().count()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hay permisos inválidos");
		}
		return new HashSet<>(found);
	}

	private String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
