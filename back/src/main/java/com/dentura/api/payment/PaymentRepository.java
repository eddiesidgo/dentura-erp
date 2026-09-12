package com.dentura.api.payment;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	List<Payment> findByClinicIdAndPatientIdOrderByPaidAtDesc(Long clinicId, Long patientId);

	Optional<Payment> findByIdAndClinicId(Long id, Long clinicId);

	List<Payment> findByClinicIdAndPatientId(Long clinicId, Long patientId);

	@Query("""
			SELECT p FROM Payment p
			WHERE p.clinicId = :clinicId
			AND (:ignoreFrom = true OR p.paidAt >= :from)
			AND (:ignoreTo = true OR p.paidAt < :to)
			ORDER BY p.paidAt DESC
			""")
	List<Payment> searchByPaidAt(
			@Param("clinicId") Long clinicId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("ignoreFrom") boolean ignoreFrom,
			@Param("ignoreTo") boolean ignoreTo);
}
