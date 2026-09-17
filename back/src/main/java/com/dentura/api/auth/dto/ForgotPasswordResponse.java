package com.dentura.api.auth.dto;

public record ForgotPasswordResponse(boolean success, String resetPath) {

	public static ForgotPasswordResponse ok(String resetPath) {
		return new ForgotPasswordResponse(true, resetPath);
	}

	public static ForgotPasswordResponse acknowledged() {
		return new ForgotPasswordResponse(true, null);
	}
}
