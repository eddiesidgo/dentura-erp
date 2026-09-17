package com.dentura.api.consent.dto;

import java.time.Instant;

import com.dentura.api.consent.PatientConsent;

public record PatientConsentResponse(
		Long id,
		Long clinicId,
		Long patientId,
		Long templateId,
		String templateTitle,
		String signerName,
		Instant acceptedAt,
		String notes,
		Instant createdAt) {

	public static PatientConsentResponse from(PatientConsent consent, String templateTitle) {
		return new PatientConsentResponse(
				consent.getId(),
				consent.getClinicId(),
				consent.getPatientId(),
				consent.getTemplateId(),
				templateTitle,
				consent.getSignerName(),
				consent.getAcceptedAt(),
				consent.getNotes(),
				consent.getCreatedAt());
	}
}
