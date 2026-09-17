package com.dentura.api.scan.dto;

import java.time.Instant;

import com.dentura.api.scan.PatientScan;

public record ScanResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String arch,
		String fileName,
		String contentType,
		long sizeBytes,
		String caption,
		Instant createdAt,
		Instant updatedAt) {

	public static ScanResponse from(PatientScan scan) {
		return new ScanResponse(
				scan.getId(),
				scan.getClinicId(),
				scan.getPatientId(),
				scan.getArch(),
				scan.getFileName(),
				scan.getContentType(),
				scan.getSizeBytes(),
				scan.getCaption(),
				scan.getCreatedAt(),
				scan.getUpdatedAt());
	}
}
