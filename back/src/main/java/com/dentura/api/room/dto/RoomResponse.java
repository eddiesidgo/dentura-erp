package com.dentura.api.room.dto;

import java.time.Instant;

import com.dentura.api.room.Room;

public record RoomResponse(
		Long id,
		Long clinicId,
		String name,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static RoomResponse from(Room room) {
		return new RoomResponse(
				room.getId(),
				room.getClinicId(),
				room.getName(),
				room.isActive(),
				room.getCreatedAt(),
				room.getUpdatedAt());
	}
}
