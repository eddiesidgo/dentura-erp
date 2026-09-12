package com.dentura.api.prescription;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

	List<Prescription> findByClinicIdAndPatientIdOrderByPrescribedAtDesc(Long clinicId, Long patientId);

	Optional<Prescription> findByIdAndClinicId(Long id, Long clinicId);
}
