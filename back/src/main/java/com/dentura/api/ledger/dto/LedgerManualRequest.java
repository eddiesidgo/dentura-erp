package com.dentura.api.ledger.dto;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LedgerManualRequest(
		@NotNull Long patientId,
		Long workId,
		@NotBlank String type,
		@NotNull BigDecimal amount,
		String description,
		Instant entryDate) {
}
