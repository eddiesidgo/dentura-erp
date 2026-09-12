package com.dentura.api.report.dto;

import java.util.List;

public record PaymentReceiptResponse(
		int receiptNumber,
		String paidAt,
		String amount,
		String method,
		String methodLabel,
		String notes,
		String patientName,
		String recordNumber,
		String dui,
		String phone,
		List<AllocationLine> allocations) {

	public record AllocationLine(String description, String amount) {
	}
}
