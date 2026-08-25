package com.dentura.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.auth.dto.SignInRequest;
import com.dentura.api.auth.dto.SignUpRequest;
import com.dentura.api.auth.dto.UserDto;
import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final JwtService jwtService;
	private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	public AuthService(
			UserRepository userRepository,
			JwtService jwtService,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
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

		return buildAuthResponse(user);
	}

	@Transactional
	public AuthResponse signUp(SignUpRequest request) {
		if (userRepository.existsByUserName(request.userName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User already exist!");
		}
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already used");
		}

		User user = new User();
		user.setUserName(request.userName());
		user.setEmail(request.email());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setAuthorities(java.util.List.of("admin", "user"));

		userRepository.save(user);
		return buildAuthResponse(user);
	}

	private AuthResponse buildAuthResponse(User user) {
		String token = jwtService.generateToken(user);
		return new AuthResponse(token, UserDto.from(user));
	}

	private ResponseStatusException unauthorized(String message) {
		return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
	}
}
