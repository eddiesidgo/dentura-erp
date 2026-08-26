package com.dentura.api.appointment.dto;

import java.time.Instant;

import com.dentura.api.appointment.Appointment;
import com.dentura.api.patient.Patient;

public record AppointmentResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String patientName,
		String recordNumber,
		Instant startAt,
		Instant endAt,
		String status,
		String reason,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static AppointmentResponse from(Appointment appointment, Patient patient) {
		return new AppointmentResponse(
				appointment.getId(),
				appointment.getClinicId(),
				appointment.getPatientId(),
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getRecordNumber(),
				appointment.getStartAt(),
				appointment.getEndAt(),
				appointment.getStatus(),
				appointment.getReason(),
				appointment.getNotes(),
				appointment.getCreatedAt(),
				appointment.getUpdatedAt());
	}
}
