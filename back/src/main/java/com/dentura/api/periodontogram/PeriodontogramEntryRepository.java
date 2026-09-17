package com.dentura.api.periodontogram;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PeriodontogramEntryRepository extends JpaRepository<PeriodontogramEntry, Long> {

	List<PeriodontogramEntry> findByClinicIdAndPatientIdOrderByToothAscRecordedAtDesc(Long clinicId, Long patientId);

	java.util.Optional<PeriodontogramEntry> findByIdAndClinicId(Long id, Long clinicId);
}
