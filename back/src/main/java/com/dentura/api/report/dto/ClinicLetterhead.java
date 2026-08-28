package com.dentura.api.report.dto;

public record ClinicLetterhead(
		String name,
		String nit,
		String addressLine,
		String cityLine,
		String phone,
		String email,
		String logoDataUri) {
}
