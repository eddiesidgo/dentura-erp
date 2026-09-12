package com.dentura.api.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.dentura.api.payment.Payment;
import com.dentura.api.payment.PaymentAllocation;

public record PaymentResponse(
		Long id,
		Long clinicId,
		Long patientId,
		int receiptNumber,
		Instant paidAt,
		BigDecimal amount,
		String method,
		String notes,
		Long createdBy,
		List<AllocationResponse> allocations,
		Instant createdAt,
		Instant updatedAt) {

	public record AllocationResponse(Long id, Long workId, BigDecimal amount) {
		public static AllocationResponse from(PaymentAllocation allocation) {
			return new AllocationResponse(allocation.getId(), allocation.getWorkId(), allocation.getAmount());
		}
	}

	public static PaymentResponse from(Payment payment, List<PaymentAllocation> allocations) {
		List<AllocationResponse> items = allocations.stream().map(AllocationResponse::from).toList();
		return new PaymentResponse(
				payment.getId(),
				payment.getClinicId(),
				payment.getPatientId(),
				payment.getReceiptNumber(),
				payment.getPaidAt(),
				payment.getAmount(),
				payment.getMethod(),
				payment.getNotes(),
				payment.getCreatedBy(),
				items,
				payment.getCreatedAt(),
				payment.getUpdatedAt());
	}
}
