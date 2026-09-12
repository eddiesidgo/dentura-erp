package com.dentura.api.referral.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OutboundReferralRequest(
		@NotNull(message = "El paciente es obligatorio") Long patientId,
		@NotBlank(message = "La especialidad es obligatoria") @Size(max = 120) String specialty,
		@Size(max = 160) String toName,
		String reason,
		@Size(max = 20) String status,
		Instant referredAt,
		String notes) {

	public OutboundReferralRequest {
		specialty = blankToNull(specialty);
		toName = blankToNull(toName);
		reason = blankToNull(reason);
		status = blankToNull(status);
		notes = blankToNull(notes);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
