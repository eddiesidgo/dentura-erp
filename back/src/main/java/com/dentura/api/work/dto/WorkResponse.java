package com.dentura.api.work.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

import com.dentura.api.patient.Patient;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.work.Work;

public record WorkResponse(
		Long id,
		Long clinicId,
		Long patientId,
		String patientName,
		String recordNumber,
		Long treatmentId,
		String treatmentCode,
		String treatmentName,
		String status,
		int quantity,
		BigDecimal unitPrice,
		BigDecimal total,
		String tooth,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static WorkResponse from(Work work, Treatment treatment) {
		return from(work, treatment, null);
	}

	public static WorkResponse from(Work work, Treatment treatment, Patient patient) {
		BigDecimal unitPrice = work.getUnitPrice() == null ? BigDecimal.ZERO : work.getUnitPrice();
		BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(work.getQuantity()))
				.setScale(2, RoundingMode.HALF_UP);
		String patientName = patient == null
				? null
				: (patient.getFirstName() + " " + patient.getLastName()).trim();
		String recordNumber = patient == null ? null : patient.getRecordNumber();
		return new WorkResponse(
				work.getId(),
				work.getClinicId(),
				work.getPatientId(),
				patientName,
				recordNumber,
				work.getTreatmentId(),
				treatment.getCode(),
				treatment.getName(),
				work.getStatus(),
				work.getQuantity(),
				unitPrice,
				total,
				work.getTooth(),
				work.getNotes(),
				work.getCreatedAt(),
				work.getUpdatedAt());
	}
}
