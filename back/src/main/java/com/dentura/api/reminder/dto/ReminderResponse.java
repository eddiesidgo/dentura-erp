package com.dentura.api.reminder.dto;

import java.time.Instant;

import com.dentura.api.reminder.ReminderQueueItem;

public record ReminderResponse(
		Long id,
		Long clinicId,
		Long appointmentId,
		Long patientId,
		String patientName,
		String phoneNormalized,
		String messageBody,
		String waMeUrl,
		String status,
		Instant scheduledFor,
		Instant sentAt,
		Instant appointmentStartAt,
		Instant createdAt) {

	public static ReminderResponse from(
			ReminderQueueItem item,
			String patientName,
			Instant appointmentStartAt) {
		return new ReminderResponse(
				item.getId(),
				item.getClinicId(),
				item.getAppointmentId(),
				item.getPatientId(),
				patientName,
				item.getPhoneNormalized(),
				item.getMessageBody(),
				item.getWaMeUrl(),
				item.getStatus(),
				item.getScheduledFor(),
				item.getSentAt(),
				appointmentStartAt,
				item.getCreatedAt());
	}
}
