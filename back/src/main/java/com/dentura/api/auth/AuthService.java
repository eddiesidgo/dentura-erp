package com.dentura.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.auth.dto.ForgotPasswordRequest;
import com.dentura.api.auth.dto.ForgotPasswordResponse;
import com.dentura.api.auth.dto.ResetPasswordRequest;
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

	private static final Logger log = LoggerFactory.getLogger(AuthService.class);
	private static final int RESET_TOKEN_HOURS = 2;

	private final UserRepository userRepository;
	private final ClinicRepository clinicRepository;
	private final RoleRepository roleRepository;
	private final PermissionService permissionService;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final JwtService jwtService;
	private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
	private final SecureRandom secureRandom = new SecureRandom();

	@Value("${dentura.public-signup-enabled:false}")
	private boolean publicSignupEnabled;

	public AuthService(
			UserRepository userRepository,
			ClinicRepository clinicRepository,
			RoleRepository roleRepository,
			PermissionService permissionService,
			PasswordResetTokenRepository passwordResetTokenRepository,
			JwtService jwtService,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.clinicRepository = clinicRepository;
		this.roleRepository = roleRepository;
		this.permissionService = permissionService;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public AuthResponse signIn(SignInRequest request) {
		User user = userRepository.findByUserName(request.userName())
				.orElseThrow(() -> unauthorized("Invalid email or password!"));

		if (!user.isActive()) {
			throw unauthorized("Invalid email or password!");
		}
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw unauthorized("Invalid email or password!");
		}

		return buildAuthResponse(user, resolveClinic(user));
	}

	@Transactional
	public AuthResponse signUp(SignUpRequest request) {
		if (!publicSignupEnabled) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El registro público está deshabilitado");
		}
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
		user.setActive(true);
		user.setClinicId(clinic.getId());
		roleRepository.findByClinicIdAndCode(clinic.getId(), "recepcion")
				.ifPresent(role -> user.getRoles().add(role));
		userRepository.save(user);
		return buildAuthResponse(user, clinic);
	}

	@Transactional
	public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
		String identifier = request.email().trim();
		Optional<User> user = userRepository.findByEmail(identifier);
		if (user.isEmpty()) {
			user = userRepository.findByUserName(identifier);
		}
		if (user.isEmpty() || !user.get().isActive()) {
			return ForgotPasswordResponse.acknowledged();
		}

		String rawToken = generateRawToken();
		PasswordResetToken token = new PasswordResetToken();
		token.setTokenHash(hashToken(rawToken));
		token.setUserId(user.get().getId());
		token.setExpiresAt(Instant.now().plus(RESET_TOKEN_HOURS, ChronoUnit.HOURS));
		passwordResetTokenRepository.save(token);

		String resetPath = "/reset-password?token=" + rawToken;
		log.info("Password reset path for user '{}': {}", user.get().getUserName(), resetPath);
		return ForgotPasswordResponse.ok(resetPath);
	}

	@Transactional
	public void resetPassword(ResetPasswordRequest request) {
		PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hashToken(request.token().trim()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o expirado"));
		if (!token.isUsable(Instant.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o expirado");
		}
		User user = userRepository.findById(token.getUserId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o expirado"));
		if (!user.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o expirado");
		}
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		userRepository.save(user);
		token.setUsedAt(Instant.now());
		passwordResetTokenRepository.save(token);
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

	private String generateRawToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return HexFormat.of().formatHex(bytes);
	}

	private String hashToken(String rawToken) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 not available", ex);
		}
	}

	private ResponseStatusException unauthorized(String message) {
		return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
	}
}
