package com.dentura.api.patient.dto;

import java.util.List;

public record PatientPageResponse(
		List<PatientResponse> data,
		long total,
		int pageIndex,
		int pageSize) {
}
