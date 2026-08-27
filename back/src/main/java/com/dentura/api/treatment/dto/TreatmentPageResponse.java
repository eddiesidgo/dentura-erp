package com.dentura.api.treatment.dto;

import java.util.List;

public record TreatmentPageResponse(
		List<TreatmentResponse> data,
		long total,
		int pageIndex,
		int pageSize) {
}
