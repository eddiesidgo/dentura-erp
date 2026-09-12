package com.dentura.api.odontogram;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OdontogramEntryRepository extends JpaRepository<OdontogramEntry, Long> {

	List<OdontogramEntry> findByClinicIdAndPatientIdOrderByToothAscCreatedAtDesc(Long clinicId, Long patientId);

	Optional<OdontogramEntry> findByIdAndClinicId(Long id, Long clinicId);
}
