package com.dentura.api.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dentura.api.audit.dto.AuditEventPageResponse;
import com.dentura.api.audit.dto.AuditEventResponse;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.domain.User;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class AuditService {

	private final AuditEventRepository auditEventRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public AuditService(
			AuditEventRepository auditEventRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.auditEventRepository = auditEventRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional
	public void log(String action, String entityType, Object entityId, String detail) {
		AuditEvent event = new AuditEvent();
		try {
			event.setClinicId(clinicAccess.requireClinicId());
		} catch (Exception ignored) {
			event.setClinicId(null);
		}
		try {
			User user = clinicAccess.currentUser().getUser();
			event.setUserId(user.getId());
			event.setUsername(user.getUserName());
		} catch (Exception ignored) {
			event.setUsername("system");
		}
		event.setAction(action);
		event.setEntityType(entityType);
		event.setEntityId(entityId == null ? null : String.valueOf(entityId));
		event.setDetail(detail);
		auditEventRepository.save(event);
	}

	@Transactional(readOnly = true)
	public AuditEventPageResponse list(String entityType, int page, int size) {
		permissionService.require(Permission.AUDIT_READ);
		Long clinicId = clinicAccess.requireClinicId();
		int safePage = Math.max(page, 1);
		int safeSize = Math.min(Math.max(size, 1), 100);
		PageRequest pageable = PageRequest.of(safePage - 1, safeSize);
		Page<AuditEvent> result;
		if (entityType == null || entityType.isBlank()) {
			result = auditEventRepository.findByClinicIdOrderByCreatedAtDesc(clinicId, pageable);
		} else {
			result = auditEventRepository.findByClinicIdAndEntityTypeOrderByCreatedAtDesc(
					clinicId, entityType.trim(), pageable);
		}
		return new AuditEventPageResponse(
				result.getContent().stream().map(AuditEventResponse::from).toList(),
				result.getTotalElements(),
				safePage,
				safeSize);
	}
}
