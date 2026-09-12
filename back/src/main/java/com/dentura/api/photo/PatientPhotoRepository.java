package com.dentura.api.photo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientPhotoRepository extends JpaRepository<PatientPhoto, Long> {

	List<PatientPhoto> findByClinicIdAndPatientIdOrderByCreatedAtDesc(Long clinicId, Long patientId);

	List<PatientPhoto> findByClinicIdAndPatientIdAndCategoryOrderByCreatedAtDesc(
			Long clinicId, Long patientId, String category);

	Optional<PatientPhoto> findByIdAndClinicId(Long id, Long clinicId);
}
