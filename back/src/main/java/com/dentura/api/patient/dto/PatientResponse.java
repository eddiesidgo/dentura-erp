package com.dentura.api.patient.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.dentura.api.patient.Patient;

public record PatientResponse(
		Long id,
		String recordNumber,
		String firstName,
		String lastName,
		String sex,
		LocalDate dateOfBirth,
		String phone,
		String mobile,
		String email,
		String address,
		String city,
		String department,
		String dui,
		String nit,
		String occupation,
		String referredBy,
		String allergies,
		String notes,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {

	public static PatientResponse from(Patient patient) {
		return new PatientResponse(
				patient.getId(),
				patient.getRecordNumber(),
				patient.getFirstName(),
				patient.getLastName(),
				patient.getSex(),
				patient.getDateOfBirth(),
				patient.getPhone(),
				patient.getMobile(),
				patient.getEmail(),
				patient.getAddress(),
				patient.getCity(),
				patient.getDepartment(),
				patient.getDui(),
				patient.getNit(),
				patient.getOccupation(),
				patient.getReferredBy(),
				patient.getAllergies(),
				patient.getNotes(),
				patient.isActive(),
				patient.getCreatedAt(),
				patient.getUpdatedAt());
	}
}
