package com.dentura.api.consent.dto;

import java.time.Instant;

import com.dentura.api.consent.ConsentTemplate;

public record ConsentTemplateResponse(
		Long id,
		Long clinicId,
		String title,
		String bodyHtml,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static ConsentTemplateResponse from(ConsentTemplate template) {
		return new ConsentTemplateResponse(
				template.getId(),
				template.getClinicId(),
				template.getTitle(),
				template.getBodyHtml(),
				template.isActive(),
				template.getCreatedAt(),
				template.getUpdatedAt());
	}
}
