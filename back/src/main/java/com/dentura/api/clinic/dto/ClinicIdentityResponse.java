package com.dentura.api.clinic.dto;

import com.dentura.api.clinic.Clinic;

public record ClinicIdentityResponse(
		Long id,
		String code,
		String name,
		String logoUrl,
		String phone,
		String email,
		String address,
		String city,
		String department,
		String nit,
		String themeMode,
		String themeColor,
		int primaryColorLevel,
		String navMode,
		String layoutType,
		String direction,
		boolean active,
		ClinicFeaturesResponse features,
		int reminderHoursBefore,
		String reminderMessageTemplate,
		String reminderDefaultCountryCode) {

	public static ClinicIdentityResponse from(Clinic clinic) {
		return new ClinicIdentityResponse(
				clinic.getId(),
				clinic.getCode(),
				clinic.getName(),
				clinic.getLogoUrl(),
				clinic.getPhone(),
				clinic.getEmail(),
				clinic.getAddress(),
				clinic.getCity(),
				clinic.getDepartment(),
				clinic.getNit(),
				clinic.getThemeMode(),
				clinic.getThemeColor(),
				clinic.getPrimaryColorLevel(),
				clinic.getNavMode(),
				clinic.getLayoutType(),
				clinic.getDirection(),
				clinic.isActive(),
				ClinicFeaturesResponse.from(clinic),
				clinic.getReminderHoursBefore(),
				clinic.getReminderMessageTemplate(),
				clinic.getReminderDefaultCountryCode());
	}
}
