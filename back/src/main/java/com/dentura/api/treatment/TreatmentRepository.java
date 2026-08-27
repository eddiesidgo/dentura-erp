package com.dentura.api.treatment;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TreatmentRepository extends JpaRepository<Treatment, Long> {

	boolean existsByClinicId(Long clinicId);

	boolean existsByClinicIdAndCodeIgnoreCase(Long clinicId, String code);

	boolean existsByClinicIdAndCodeIgnoreCaseAndIdNot(Long clinicId, String code, Long id);

	Optional<Treatment> findByIdAndClinicId(Long id, Long clinicId);

	@Query("""
			SELECT t FROM Treatment t
			WHERE t.clinicId = :clinicId
			AND (:active IS NULL OR t.active = :active)
			AND (
				:q IS NULL OR :q = ''
				OR LOWER(t.code) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%'))
			)
			""")
	Page<Treatment> search(
			@Param("clinicId") Long clinicId,
			@Param("q") String q,
			@Param("active") Boolean active,
			Pageable pageable);
}
