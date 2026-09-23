package com.dentura.api.clinic.dto;

import com.dentura.api.clinic.Clinic;

public record ClinicFeaturesResponse(
		String providerMode,
		String roomMode,
		boolean referralsInboundEnabled,
		boolean referralsOutboundEnabled) {

	public static ClinicFeaturesResponse from(Clinic clinic) {
		return new ClinicFeaturesResponse(
				clinic.getProviderMode(),
				clinic.getRoomMode(),
				clinic.isReferralsInboundEnabled(),
				clinic.isReferralsOutboundEnabled());
	}
}
