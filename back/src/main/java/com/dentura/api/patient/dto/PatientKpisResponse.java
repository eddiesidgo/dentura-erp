package com.dentura.api.patient.dto;

public record PatientKpisResponse(
		long totalPatients,
		long newPatientsThisMonth,
		long patientsWithUpcomingAppointment,
		long inactivePatients,
		int upcomingDays,
		int inactivityDays) {
}
