package com.dentura.api.clinic;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public enum ClinicDeliveryPreset {
	BASIC,
	MULTI_DOCTOR,
	FULL;

	public static ClinicDeliveryPreset from(String value) {
		if (value == null || value.isBlank()) {
			return FULL;
		}
		try {
			return ClinicDeliveryPreset.valueOf(value.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preset de clínica inválido");
		}
	}

	public void applyTo(Clinic clinic) {
		switch (this) {
			case BASIC -> {
				clinic.setProviderMode(Clinic.PROVIDER_MODE_SINGLE);
				clinic.setRoomMode(Clinic.ROOM_MODE_OFF);
				clinic.setReferralsInboundEnabled(false);
				clinic.setReferralsOutboundEnabled(false);
			}
			case MULTI_DOCTOR -> {
				clinic.setProviderMode(Clinic.PROVIDER_MODE_MULTI);
				clinic.setRoomMode(Clinic.ROOM_MODE_OPTIONAL);
				clinic.setReferralsInboundEnabled(false);
				clinic.setReferralsOutboundEnabled(false);
			}
			case FULL -> {
				clinic.setProviderMode(Clinic.PROVIDER_MODE_MULTI);
				clinic.setRoomMode(Clinic.ROOM_MODE_OPTIONAL);
				clinic.setReferralsInboundEnabled(true);
				clinic.setReferralsOutboundEnabled(true);
			}
		}
	}
}
