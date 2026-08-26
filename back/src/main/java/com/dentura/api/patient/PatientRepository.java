package com.dentura.api.patient;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

	boolean existsByRecordNumber(String recordNumber);

	boolean existsByDui(String dui);

	boolean existsByDuiAndIdNot(String dui, Long id);

	boolean existsByRecordNumberAndIdNot(String recordNumber, Long id);

	Optional<Patient> findByRecordNumber(String recordNumber);

	@Query("""
			SELECT p FROM Patient p
			WHERE (:active IS NULL OR p.active = :active)
			AND (
				:q IS NULL OR :q = ''
				OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(CONCAT(p.lastName, ' ', p.firstName)) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(p.recordNumber) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(p.dui, '')) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(p.nit, '')) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(p.phone, '')) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(p.mobile, '')) LIKE LOWER(CONCAT('%', :q, '%'))
				OR LOWER(COALESCE(p.email, '')) LIKE LOWER(CONCAT('%', :q, '%'))
			)
			""")
	Page<Patient> search(@Param("q") String q, @Param("active") Boolean active, Pageable pageable);
}
