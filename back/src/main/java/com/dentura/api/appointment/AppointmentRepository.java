package com.dentura.api.appointment;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

	List<Appointment> findByClinicIdAndStartAtGreaterThanEqualAndStartAtLessThanOrderByStartAtAsc(
			Long clinicId,
			Instant from,
			Instant to);

	@Query("""
			SELECT COUNT(DISTINCT a.patientId) FROM Appointment a
			WHERE a.clinicId = :clinicId
			AND a.startAt >= :from
			AND a.startAt < :to
			AND a.status IN :statuses
			""")
	long countDistinctPatientsByClinicIdAndDateRangeAndStatuses(
			@Param("clinicId") Long clinicId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("statuses") Set<String> statuses);
}
