package com.dentura.api.medication;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicationRepository extends JpaRepository<Medication, Long> {

	boolean existsByClinicId(Long clinicId);

	long countByClinicId(Long clinicId);

	boolean existsByClinicIdAndCodeIgnoreCase(Long clinicId, String code);

	boolean existsByClinicIdAndCodeIgnoreCaseAndIdNot(Long clinicId, String code, Long id);

	Optional<Medication> findByIdAndClinicId(Long id, Long clinicId);

	Optional<Medication> findByClinicIdAndCodeIgnoreCase(Long clinicId, String code);

	@Query("""
			SELECT m FROM Medication m
			WHERE m.clinicId = :clinicId
			AND (:active IS NULL OR m.active = :active)
			AND (
				:q IS NULL OR :q = ''
				OR LOWER(m.code) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(m.name) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(m.form, '')) LIKE LOWER(CONCAT('%', :q, '%'))
			)
			""")
	Page<Medication> search(
			@Param("clinicId") Long clinicId,
			@Param("q") String q,
			@Param("active") Boolean active,
			Pageable pageable);
}
