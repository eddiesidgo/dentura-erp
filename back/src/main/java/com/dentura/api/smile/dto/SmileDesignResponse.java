package com.dentura.api.smile.dto;

import java.time.Instant;

import com.dentura.api.smile.SmileDesign;

public record SmileDesignResponse(
		Long id,
		Long clinicId,
		Long patientId,
		Long scanId,
		String name,
		String status,
		String designJson,
		String exportFileName,
		String exportContentType,
		Long exportSizeBytes,
		boolean hasExport,
		int version,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static SmileDesignResponse from(SmileDesign design) {
		return new SmileDesignResponse(
				design.getId(),
				design.getClinicId(),
				design.getPatientId(),
				design.getScanId(),
				design.getName(),
				design.getStatus(),
				design.getDesignJson(),
				design.getExportFileName(),
				design.getExportContentType(),
				design.getExportSizeBytes(),
				design.getExportRelativePath() != null && !design.getExportRelativePath().isBlank(),
				design.getVersion(),
				design.getNotes(),
				design.getCreatedAt(),
				design.getUpdatedAt());
	}
}
