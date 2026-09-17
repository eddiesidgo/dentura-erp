package com.dentura.api.scan;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientScanRepository extends JpaRepository<PatientScan, Long> {

	List<PatientScan> findByClinicIdAndPatientIdOrderByCreatedAtDesc(Long clinicId, Long patientId);

	List<PatientScan> findByClinicIdAndPatientIdAndArchOrderByCreatedAtDesc(
			Long clinicId, Long patientId, String arch);

	Optional<PatientScan> findByIdAndClinicId(Long id, Long clinicId);
}
