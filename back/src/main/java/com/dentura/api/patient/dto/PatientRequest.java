package com.dentura.api.patient.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientRequest(
		@Size(max = 20) String recordNumber,
		@NotBlank(message = "El nombre es obligatorio") @Size(max = 120) String firstName,
		@NotBlank(message = "El apellido es obligatorio") @Size(max = 120) String lastName,
		@Pattern(regexp = "MALE|FEMALE|OTHER", message = "Sexo inválido") String sex,
		LocalDate dateOfBirth,
		@Size(max = 40) String phone,
		@Size(max = 40) String mobile,
		@Email(message = "Correo inválido") @Size(max = 255) String email,
		@Size(max = 255) String address,
		@Size(max = 120) String city,
		@Size(max = 120) String department,
		@Size(max = 20) String dui,
		@Size(max = 30) String nit,
		@Size(max = 120) String occupation,
		@Size(max = 160) String referredBy,
		Long referralSourceId,
		String allergies,
		String notes,
		Boolean active) {

	public PatientRequest {
		recordNumber = blankToNull(recordNumber);
		firstName = blankToNull(firstName);
		lastName = blankToNull(lastName);
		sex = blankToNull(sex);
		phone = blankToNull(phone);
		mobile = blankToNull(mobile);
		email = blankToNull(email);
		address = blankToNull(address);
		city = blankToNull(city);
		department = blankToNull(department);
		dui = blankToNull(dui);
		nit = blankToNull(nit);
		occupation = blankToNull(occupation);
		referredBy = blankToNull(referredBy);
		allergies = blankToNull(allergies);
		notes = blankToNull(notes);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
