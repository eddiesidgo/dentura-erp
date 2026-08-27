package com.dentura.api.treatment.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.dentura.api.treatment.Treatment;

public record TreatmentResponse(
		Long id,
		Long clinicId,
		String code,
		String name,
		BigDecimal price,
		boolean active,
		int sortOrder,
		Instant createdAt,
		Instant updatedAt) {

	public static TreatmentResponse from(Treatment treatment) {
		return new TreatmentResponse(
				treatment.getId(),
				treatment.getClinicId(),
				treatment.getCode(),
				treatment.getName(),
				treatment.getPrice(),
				treatment.isActive(),
				treatment.getSortOrder(),
				treatment.getCreatedAt(),
				treatment.getUpdatedAt());
	}
}
