package com.dentura.api.audit.dto;

import java.time.Instant;

import com.dentura.api.audit.AuditEvent;

public record AuditEventResponse(
		Long id,
		Long clinicId,
		Long userId,
		String username,
		String action,
		String entityType,
		String entityId,
		String detail,
		Instant createdAt) {

	public static AuditEventResponse from(AuditEvent event) {
		return new AuditEventResponse(
				event.getId(),
				event.getClinicId(),
				event.getUserId(),
				event.getUsername(),
				event.getAction(),
				event.getEntityType(),
				event.getEntityId(),
				event.getDetail(),
				event.getCreatedAt());
	}
}
