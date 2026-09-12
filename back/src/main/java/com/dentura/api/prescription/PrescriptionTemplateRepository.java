package com.dentura.api.prescription;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionTemplateRepository extends JpaRepository<PrescriptionTemplate, Long> {

	List<PrescriptionTemplate> findByClinicIdOrderByDrugAsc(Long clinicId);

	Optional<PrescriptionTemplate> findByIdAndClinicId(Long id, Long clinicId);
}
