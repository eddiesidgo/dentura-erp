package com.dentura.api.auth;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.auth.dto.SignInRequest;
import com.dentura.api.auth.dto.SignUpRequest;
import com.dentura.api.auth.dto.UserDto;
import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicRepository;
import com.dentura.api.clinic.ClinicService;
import com.dentura.api.clinic.dto.ClinicIdentityResponse;
import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;
import com.dentura.api.role.PermissionService;
import com.dentura.api.role.RoleRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final ClinicRepository clinicRepository;
	private final RoleRepository roleRepository;
	private final PermissionService permissionService;
	private final JwtService jwtService;
	private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	public AuthService(
			UserRepository userRepository,
			ClinicRepository clinicRepository,
			RoleRepository roleRepository,
			PermissionService permissionService,
			JwtService jwtService,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.clinicRepository = clinicRepository;
		this.roleRepository = roleRepository;
		this.permissionService = permissionService;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public AuthResponse signIn(SignInRequest request) {
		User user = userRepository.findByUserName(request.userName())
				.orElseThrow(() -> unauthorized("Invalid email or password!"));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw unauthorized("Invalid email or password!");
		}

		return buildAuthResponse(user, resolveClinic(user));
	}

	@Transactional
	public AuthResponse signUp(SignUpRequest request) {
		if (userRepository.existsByUserName(request.userName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User already exist!");
		}
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already used");
		}

		Clinic clinic = defaultClinic();
		User user = new User();
		user.setUserName(request.userName());
		user.setEmail(request.email());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setAuthorities(List.of("user"));
		user.setClinicId(clinic.getId());
		roleRepository.findByClinicIdAndCode(clinic.getId(), "recepcion")
				.ifPresent(role -> user.getRoles().add(role));
		userRepository.save(user);
		return buildAuthResponse(user, clinic);
	}

	private AuthResponse buildAuthResponse(User user, Clinic clinic) {
		Long clinicId = clinic == null ? null : clinic.getId();
		return new AuthResponse(
				jwtService.generateToken(user, clinicId),
				UserDto.from(user, clinicId, permissionService.codesFor(user, clinicId)),
				clinic == null ? null : ClinicIdentityResponse.from(clinic));
	}

	private Clinic resolveClinic(User user) {
		if (user.getClinicId() != null) {
			return clinicRepository.findById(user.getClinicId())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clínica no encontrada"));
		}
		if (user.isSuperAdmin()) {
			return defaultClinic();
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene clínica asignada");
	}

	private Clinic defaultClinic() {
		return clinicRepository.findByCode(ClinicService.DEFAULT_CODE)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Clínica default no configurada"));
	}

	private ResponseStatusException unauthorized(String message) {
		return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
	}
}
