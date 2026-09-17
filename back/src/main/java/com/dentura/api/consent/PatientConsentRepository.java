package com.dentura.api.consent;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientConsentRepository extends JpaRepository<PatientConsent, Long> {

	List<PatientConsent> findByClinicIdAndPatientIdOrderByAcceptedAtDesc(Long clinicId, Long patientId);

	Optional<PatientConsent> findByIdAndClinicId(Long id, Long clinicId);
}
