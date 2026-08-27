package com.dentura.api.work;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRepository extends JpaRepository<Work, Long> {

	List<Work> findByClinicIdAndPatientIdOrderByCreatedAtDesc(Long clinicId, Long patientId);

	Optional<Work> findByIdAndClinicId(Long id, Long clinicId);

	boolean existsByTreatmentId(Long treatmentId);
}
