package com.dentura.api.odontogram.dto;

import java.time.Instant;

import com.dentura.api.odontogram.OdontogramEntry;

public record OdontogramEntryResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String tooth,
		String surfaces,
		String condition,
		String status,
		Long workId,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static OdontogramEntryResponse from(OdontogramEntry entry) {
		return new OdontogramEntryResponse(
				entry.getId(),
				entry.getClinicId(),
				entry.getPatientId(),
				entry.getTooth(),
				entry.getSurfaces(),
				entry.getCondition(),
				entry.getStatus(),
				entry.getWorkId(),
				entry.getNotes(),
				entry.getCreatedAt(),
				entry.getUpdatedAt());
	}
}
