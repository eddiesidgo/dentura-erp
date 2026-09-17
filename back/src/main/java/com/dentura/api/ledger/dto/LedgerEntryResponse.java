package com.dentura.api.ledger.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.dentura.api.ledger.LedgerEntry;

public record LedgerEntryResponse(
		Long id,
		Long clinicId,
		Long patientId,
		Long workId,
		String type,
		BigDecimal amount,
		String description,
		Instant entryDate,
		Long paymentId,
		Instant createdAt) {

	public static LedgerEntryResponse from(LedgerEntry entry) {
		return new LedgerEntryResponse(
				entry.getId(),
				entry.getClinicId(),
				entry.getPatientId(),
				entry.getWorkId(),
				entry.getType(),
				entry.getAmount(),
				entry.getDescription(),
				entry.getEntryDate(),
				entry.getPaymentId(),
				entry.getCreatedAt());
	}
}
