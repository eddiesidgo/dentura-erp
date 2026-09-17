package com.dentura.api.role;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;
import com.dentura.api.role.dto.ClinicUserRolesResponse;
import com.dentura.api.role.dto.CreateClinicUserRequest;
import com.dentura.api.role.dto.UpdateClinicUserRequest;

@Service
public class ClinicUserService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final PasswordEncoder passwordEncoder;

	public ClinicUserService(
			UserRepository userRepository,
			RoleRepository roleRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public ClinicUserRolesResponse create(CreateClinicUserRequest request) {
		permissionService.require(Permission.ROLES_MANAGE);
		Long clinicId = clinicAccess.requireClinicId();
		String userName = request.userName().trim();
		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByUserName(userName)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese nombre");
		}
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
		}

		User user = new User();
		user.setUserName(userName);
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setAuthorities(List.of("user"));
		user.setActive(true);
		user.setClinicId(clinicId);
		user.setRoles(loadClinicRoles(clinicId, request.roleIds()));
		userRepository.save(user);
		return toResponse(user, clinicId);
	}

	@Transactional
	public ClinicUserRolesResponse update(Long id, UpdateClinicUserRequest request) {
		permissionService.require(Permission.ROLES_MANAGE);
		Long clinicId = clinicAccess.requireClinicId();
		User user = requireInClinic(id, clinicId);

		if (request.roleIds() != null) {
			Set<Role> kept = new HashSet<>();
			for (Role existing : user.getRoles()) {
				if (!clinicId.equals(existing.getClinicId())) {
					kept.add(existing);
				}
			}
			kept.addAll(loadClinicRoles(clinicId, request.roleIds()));
			user.setRoles(kept);
		}
		if (request.active() != null) {
			user.setActive(request.active());
		}
		if (request.password() != null && !request.password().isBlank()) {
			user.setPasswordHash(passwordEncoder.encode(request.password()));
		}
		userRepository.save(user);
		return toResponse(user, clinicId);
	}

	private User requireInClinic(Long id, Long clinicId) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
		if (!clinicId.equals(user.getClinicId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no pertenece a esta clínica");
		}
		return user;
	}

	private Set<Role> loadClinicRoles(Long clinicId, List<Long> roleIds) {
		Set<Role> roles = new HashSet<>();
		if (roleIds == null || roleIds.isEmpty()) {
			return roles;
		}
		for (Long roleId : roleIds) {
			Role role = roleRepository.findByIdAndClinicId(roleId, clinicId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol inválido"));
			roles.add(role);
		}
		return roles;
	}

	private ClinicUserRolesResponse toResponse(User user, Long clinicId) {
		return new ClinicUserRolesResponse(
				user.getId(),
				user.getUserName(),
				user.getEmail(),
				user.isActive(),
				user.getRoles().stream()
						.filter(role -> clinicId.equals(role.getClinicId()))
						.map(Role::getId)
						.toList());
	}
}
