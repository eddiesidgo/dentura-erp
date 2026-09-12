package com.dentura.api.referral;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboundReferralRepository extends JpaRepository<OutboundReferral, Long> {

	List<OutboundReferral> findByClinicIdAndPatientIdOrderByReferredAtDesc(Long clinicId, Long patientId);

	Optional<OutboundReferral> findByIdAndClinicId(Long id, Long clinicId);
}
