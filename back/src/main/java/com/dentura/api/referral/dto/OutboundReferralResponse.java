package com.dentura.api.referral.dto;

import java.time.Instant;

import com.dentura.api.referral.OutboundReferral;

public record OutboundReferralResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String specialty,
		String toName,
		String reason,
		String status,
		Instant referredAt,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static OutboundReferralResponse from(OutboundReferral referral) {
		return new OutboundReferralResponse(
				referral.getId(),
				referral.getClinicId(),
				referral.getPatientId(),
				referral.getSpecialty(),
				referral.getToName(),
				referral.getReason(),
				referral.getStatus(),
				referral.getReferredAt(),
				referral.getNotes(),
				referral.getCreatedAt(),
				referral.getUpdatedAt());
	}
}
