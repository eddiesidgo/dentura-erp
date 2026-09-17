package com.dentura.api.appointment.dto;

import java.time.Instant;

import com.dentura.api.appointment.Appointment;
import com.dentura.api.patient.Patient;
import com.dentura.api.provider.Provider;
import com.dentura.api.room.Room;

public record AppointmentResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String patientName,
		String recordNumber,
		Long providerId,
		String providerName,
		String providerColor,
		Long roomId,
		String roomName,
		Instant startAt,
		Instant endAt,
		String status,
		String reason,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static AppointmentResponse from(
			Appointment appointment,
			Patient patient,
			Provider provider,
			Room room) {
		return new AppointmentResponse(
				appointment.getId(),
				appointment.getClinicId(),
				appointment.getPatientId(),
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getRecordNumber(),
				provider.getId(),
				provider.getName(),
				provider.getColor(),
				room == null ? null : room.getId(),
				room == null ? null : room.getName(),
				appointment.getStartAt(),
				appointment.getEndAt(),
				appointment.getStatus(),
				appointment.getReason(),
				appointment.getNotes(),
				appointment.getCreatedAt(),
				appointment.getUpdatedAt());
	}
}
