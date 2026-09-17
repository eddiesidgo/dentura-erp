package com.dentura.api.provider.dto;

import java.time.Instant;

import com.dentura.api.provider.Provider;

public record ProviderResponse(
		Long id,
		Long clinicId,
		String name,
		String color,
		Long userId,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static ProviderResponse from(Provider provider) {
		return new ProviderResponse(
				provider.getId(),
				provider.getClinicId(),
				provider.getName(),
				provider.getColor(),
				provider.getUserId(),
				provider.isActive(),
				provider.getCreatedAt(),
				provider.getUpdatedAt());
	}
}
