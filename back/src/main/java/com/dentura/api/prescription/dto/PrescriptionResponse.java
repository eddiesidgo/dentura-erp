package com.dentura.api.prescription.dto;

import java.time.Instant;

import com.dentura.api.prescription.Prescription;

public record PrescriptionResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String drug,
		String dose,
		String frequency,
		String duration,
		String instructions,
		Instant prescribedAt,
		Long templateId,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static PrescriptionResponse from(Prescription prescription) {
		return new PrescriptionResponse(
				prescription.getId(),
				prescription.getClinicId(),
				prescription.getPatientId(),
				prescription.getDrug(),
				prescription.getDose(),
				prescription.getFrequency(),
				prescription.getDuration(),
				prescription.getInstructions(),
				prescription.getPrescribedAt(),
				prescription.getTemplateId(),
				prescription.getNotes(),
				prescription.getCreatedAt(),
				prescription.getUpdatedAt());
	}
}
