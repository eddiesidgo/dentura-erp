package com.dentura.api.audit.dto;

import java.util.List;

public record AuditEventPageResponse(
		List<AuditEventResponse> data,
		long total,
		int page,
		int size) {
}
