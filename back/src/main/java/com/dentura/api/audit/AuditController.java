package com.dentura.api.audit;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.audit.dto.AuditEventPageResponse;

@RestController
@RequestMapping("/api/audit-events")
public class AuditController {

	private final AuditService auditService;

	public AuditController(AuditService auditService) {
		this.auditService = auditService;
	}

	@GetMapping
	public AuditEventPageResponse list(
			@RequestParam(name = "entityType", required = false) String entityType,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "20") int size) {
		return auditService.list(entityType, page, size);
	}
}
