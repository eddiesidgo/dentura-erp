package com.dentura.api.periodontogram.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PeriodontogramEntryRequest(
		@NotNull Long patientId,
		@NotBlank String tooth,
		String valuesJson,
		String notes,
		Instant recordedAt) {
}
