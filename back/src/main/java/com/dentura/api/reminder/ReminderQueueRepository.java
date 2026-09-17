package com.dentura.api.reminder;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderQueueRepository extends JpaRepository<ReminderQueueItem, Long> {

	List<ReminderQueueItem> findByClinicIdOrderByScheduledForAsc(Long clinicId);

	List<ReminderQueueItem> findByClinicIdAndStatusOrderByScheduledForAsc(Long clinicId, String status);

	Optional<ReminderQueueItem> findByIdAndClinicId(Long id, Long clinicId);

	boolean existsByAppointmentId(Long appointmentId);
}
