package com.dentura.api.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoomRequest(
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 120) String name,
		Boolean active) {

	public RoomRequest {
		name = name == null ? null : name.trim();
	}
}
