package com.dentura.api.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

	Page<AuditEvent> findByClinicIdOrderByCreatedAtDesc(Long clinicId, Pageable pageable);

	Page<AuditEvent> findByClinicIdAndEntityTypeOrderByCreatedAtDesc(
			Long clinicId,
			String entityType,
			Pageable pageable);
}
