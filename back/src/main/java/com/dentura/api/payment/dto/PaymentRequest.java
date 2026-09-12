package com.dentura.api.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentRequest(
		@NotNull(message = "El paciente es obligatorio") Long patientId,
		Instant paidAt,
		@NotNull(message = "El monto es obligatorio") @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0") BigDecimal amount,
		@NotBlank(message = "El método de pago es obligatorio") @Size(max = 20) String method,
		String notes,
		@Valid List<AllocationRequest> allocations) {

	public PaymentRequest {
		method = blankToNull(method);
		notes = blankToNull(notes);
		allocations = allocations == null ? List.of() : List.copyOf(allocations);
	}

	public record AllocationRequest(
			Long workId,
			@NotNull(message = "El monto de la asignación es obligatorio") @DecimalMin(value = "0.01", message = "El monto de la asignación debe ser mayor a 0") BigDecimal amount) {
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
