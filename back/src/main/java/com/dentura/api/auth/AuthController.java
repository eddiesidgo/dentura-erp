package com.dentura.api.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.auth.dto.ForgotPasswordRequest;
import com.dentura.api.auth.dto.ForgotPasswordResponse;
import com.dentura.api.auth.dto.ResetPasswordRequest;
import com.dentura.api.auth.dto.SignInRequest;
import com.dentura.api.auth.dto.SignUpRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/sign-in")
	public AuthResponse signIn(@Valid @RequestBody SignInRequest request) {
		return authService.signIn(request);
	}

	@PostMapping("/sign-up")
	public AuthResponse signUp(@Valid @RequestBody SignUpRequest request) {
		return authService.signUp(request);
	}

	@PostMapping("/sign-out")
	public ResponseEntity<Boolean> signOut() {
		// Stateless JWT — client clears token; endpoint kept for front contract.
		return ResponseEntity.ok(true);
	}

	@PostMapping("/forgot-password")
	public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		return authService.forgotPassword(request);
	}

	@PostMapping("/reset-password")
	public ResponseEntity<Boolean> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request);
		return ResponseEntity.ok(true);
	}
}
