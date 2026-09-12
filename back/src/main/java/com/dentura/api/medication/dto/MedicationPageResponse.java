package com.dentura.api.medication.dto;

import java.util.List;

public record MedicationPageResponse(
		List<MedicationResponse> data,
		long total,
		int pageIndex,
		int pageSize) {
}
