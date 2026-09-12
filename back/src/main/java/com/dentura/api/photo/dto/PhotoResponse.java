package com.dentura.api.photo.dto;

import java.time.Instant;

import com.dentura.api.photo.PatientPhoto;

public record PhotoResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String category,
		String fileName,
		String contentType,
		long sizeBytes,
		String caption,
		Instant takenAt,
		Instant createdAt,
		Instant updatedAt) {

	public static PhotoResponse from(PatientPhoto photo) {
		return new PhotoResponse(
				photo.getId(),
				photo.getClinicId(),
				photo.getPatientId(),
				photo.getCategory(),
				photo.getFileName(),
				photo.getContentType(),
				photo.getSizeBytes(),
				photo.getCaption(),
				photo.getTakenAt(),
				photo.getCreatedAt(),
				photo.getUpdatedAt());
	}
}
