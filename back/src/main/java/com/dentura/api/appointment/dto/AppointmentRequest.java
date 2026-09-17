package com.dentura.api.appointment.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

public record AppointmentRequest(
		@NotNull(message = "El paciente es obligatorio") Long patientId,
		Long providerId,
		Long roomId,
		@NotNull(message = "La hora de inicio es obligatoria") Instant startAt,
		@NotNull(message = "La hora de fin es obligatoria") Instant endAt,
		String status,
		String reason,
		String notes) {

	public AppointmentRequest {
		reason = blankToNull(reason);
		notes = blankToNull(notes);
		status = blankToNull(status);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
