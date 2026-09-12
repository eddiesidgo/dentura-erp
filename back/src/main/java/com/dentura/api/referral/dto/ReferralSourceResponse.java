package com.dentura.api.referral.dto;

import java.time.Instant;

import com.dentura.api.referral.ReferralSource;

public record ReferralSourceResponse(
		Long id,
		Long clinicId,
		String name,
		String type,
		String phone,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static ReferralSourceResponse from(ReferralSource source) {
		return new ReferralSourceResponse(
				source.getId(),
				source.getClinicId(),
				source.getName(),
				source.getType(),
				source.getPhone(),
				source.isActive(),
				source.getCreatedAt(),
				source.getUpdatedAt());
	}
}
