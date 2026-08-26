package com.dentura.api.clinic.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateClinicRequest(
		@NotBlank
		@Size(max = 160)
		String name,
		@Size(max = 512)
		String logoUrl,
		@Size(max = 40)
		String phone,
		@Size(max = 255)
		String email,
		@Size(max = 255)
		String address,
		@Size(max = 120)
		String city,
		@Size(max = 120)
		String department,
		@Size(max = 30)
		String nit,
		@Size(max = 16)
		String themeMode,
		@Size(max = 32)
		String themeColor,
		@Min(400)
		@Max(900)
		Integer primaryColorLevel,
		@Size(max = 32)
		String navMode,
		@Size(max = 32)
		String layoutType,
		@Size(max = 8)
		String direction) {
}
