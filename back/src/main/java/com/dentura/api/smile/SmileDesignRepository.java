package com.dentura.api.smile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SmileDesignRepository extends JpaRepository<SmileDesign, Long> {

	List<SmileDesign> findByClinicIdAndPatientIdOrderByUpdatedAtDesc(Long clinicId, Long patientId);

	Optional<SmileDesign> findByIdAndClinicId(Long id, Long clinicId);
}
