package com.dentura.api.medication.dto;

import java.time.Instant;

import com.dentura.api.medication.Medication;

public record MedicationResponse(
		Long id,
		Long clinicId,
		String code,
		String name,
		String form,
		String dose,
		String frequency,
		String duration,
		String instructions,
		boolean active,
		int sortOrder,
		Instant createdAt,
		Instant updatedAt) {

	public static MedicationResponse from(Medication medication) {
		return new MedicationResponse(
				medication.getId(),
				medication.getClinicId(),
				medication.getCode(),
				medication.getName(),
				medication.getForm(),
				medication.getDose(),
				medication.getFrequency(),
				medication.getDuration(),
				medication.getInstructions(),
				medication.isActive(),
				medication.getSortOrder(),
				medication.getCreatedAt(),
				medication.getUpdatedAt());
	}
}
