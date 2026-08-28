package com.dentura.api.report.dto;

public record ReportClinicView(
		Long id,
		String name,
		String nit,
		String addressLine,
		String cityLine,
		String phone,
		String email,
		String logoUrl,
		String logoDataUri) {
}
