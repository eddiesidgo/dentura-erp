package com.dentura.api.payment;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface ClinicReceiptSequenceRepository extends JpaRepository<ClinicReceiptSequence, Long> {

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT s FROM ClinicReceiptSequence s WHERE s.clinicId = :clinicId")
	Optional<ClinicReceiptSequence> findByClinicIdForUpdate(@Param("clinicId") Long clinicId);
}
