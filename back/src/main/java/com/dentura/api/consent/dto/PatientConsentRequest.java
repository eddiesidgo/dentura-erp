package com.dentura.api.consent.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PatientConsentRequest(
		@NotNull Long patientId,
		@NotNull Long templateId,
		@NotBlank String signerName,
		Instant acceptedAt,
		String notes) {
}
