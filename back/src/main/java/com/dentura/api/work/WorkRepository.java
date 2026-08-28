package com.dentura.api.work;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkRepository extends JpaRepository<Work, Long> {

	List<Work> findByClinicIdAndPatientIdOrderByCreatedAtDesc(Long clinicId, Long patientId);

	Optional<Work> findByIdAndClinicId(Long id, Long clinicId);

	boolean existsByTreatmentId(Long treatmentId);

	@Query("""
			SELECT w FROM Work w
			WHERE w.clinicId = :clinicId
			AND (:patientId IS NULL OR w.patientId = :patientId)
			AND (:status IS NULL OR w.status = :status)
			AND (:treatmentId IS NULL OR w.treatmentId = :treatmentId)
			AND (:ignoreFrom = true OR w.createdAt >= :from)
			AND (:ignoreTo = true OR w.createdAt < :to)
			ORDER BY w.createdAt DESC
			""")
	List<Work> search(
			@Param("clinicId") Long clinicId,
			@Param("patientId") Long patientId,
			@Param("status") String status,
			@Param("treatmentId") Long treatmentId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("ignoreFrom") boolean ignoreFrom,
			@Param("ignoreTo") boolean ignoreTo);
}
