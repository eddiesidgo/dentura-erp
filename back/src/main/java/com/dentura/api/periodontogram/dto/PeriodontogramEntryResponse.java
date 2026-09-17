package com.dentura.api.periodontogram.dto;

import java.time.Instant;

import com.dentura.api.periodontogram.PeriodontogramEntry;

public record PeriodontogramEntryResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String tooth,
		String valuesJson,
		String notes,
		Instant recordedAt,
		Instant createdAt,
		Instant updatedAt) {

	public static PeriodontogramEntryResponse from(PeriodontogramEntry entry) {
		return new PeriodontogramEntryResponse(
				entry.getId(),
				entry.getClinicId(),
				entry.getPatientId(),
				entry.getTooth(),
				entry.getValuesJson(),
				entry.getNotes(),
				entry.getRecordedAt(),
				entry.getCreatedAt(),
				entry.getUpdatedAt());
	}
}
