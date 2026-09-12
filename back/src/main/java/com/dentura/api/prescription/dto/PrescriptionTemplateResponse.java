package com.dentura.api.prescription.dto;

import java.time.Instant;

import com.dentura.api.prescription.PrescriptionTemplate;

public record PrescriptionTemplateResponse(
		Long id,
		Long clinicId,
		String drug,
		String dose,
		String frequency,
		String duration,
		String instructions,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static PrescriptionTemplateResponse from(PrescriptionTemplate template) {
		return new PrescriptionTemplateResponse(
				template.getId(),
				template.getClinicId(),
				template.getDrug(),
				template.getDose(),
				template.getFrequency(),
				template.getDuration(),
				template.getInstructions(),
				template.isActive(),
				template.getCreatedAt(),
				template.getUpdatedAt());
	}
}
