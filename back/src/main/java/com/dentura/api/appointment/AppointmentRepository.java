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
			SELECT a FROM Appointment a
			WHERE a.clinicId = :clinicId
			AND a.startAt >= :from
			AND a.startAt < :to
			AND (:providerId IS NULL OR a.providerId = :providerId)
			AND (:roomId IS NULL OR a.roomId = :roomId)
			ORDER BY a.startAt ASC
			""")
	List<Appointment> search(
			@Param("clinicId") Long clinicId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("providerId") Long providerId,
			@Param("roomId") Long roomId);

	@Query("""
			SELECT a FROM Appointment a
			WHERE a.clinicId = :clinicId
			AND a.providerId = :providerId
			AND a.status <> :cancelled
			AND a.startAt < :endAt
			AND a.endAt > :startAt
			AND (:excludeId IS NULL OR a.id <> :excludeId)
			""")
	List<Appointment> findOverlappingForProvider(
			@Param("clinicId") Long clinicId,
			@Param("providerId") Long providerId,
			@Param("startAt") Instant startAt,
			@Param("endAt") Instant endAt,
			@Param("cancelled") String cancelled,
			@Param("excludeId") Long excludeId);

	@Query("""
			SELECT a FROM Appointment a
			WHERE a.clinicId = :clinicId
			AND a.roomId = :roomId
			AND a.status <> :cancelled
			AND a.startAt < :endAt
			AND a.endAt > :startAt
			AND (:excludeId IS NULL OR a.id <> :excludeId)
			""")
	List<Appointment> findOverlappingForRoom(
			@Param("clinicId") Long clinicId,
			@Param("roomId") Long roomId,
			@Param("startAt") Instant startAt,
			@Param("endAt") Instant endAt,
			@Param("cancelled") String cancelled,
			@Param("excludeId") Long excludeId);

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

	@Query("""
			SELECT a FROM Appointment a
			WHERE a.clinicId = :clinicId
			AND a.startAt >= :from
			AND a.startAt < :to
			AND a.status IN :statuses
			ORDER BY a.startAt ASC
			""")
	List<Appointment> findForReminders(
			@Param("clinicId") Long clinicId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			@Param("statuses") Set<String> statuses);
}
