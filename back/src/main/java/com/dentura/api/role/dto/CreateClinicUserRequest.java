package com.dentura.api.role.dto;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClinicUserRequest(
		@NotBlank(message = "El usuario es obligatorio") @Size(max = 100) String userName,
		@NotBlank(message = "El correo es obligatorio") @Email @Size(max = 255) String email,
		@NotBlank(message = "La contraseña es obligatoria") @Size(min = 6, max = 100) String password,
		List<Long> roleIds) {
}
