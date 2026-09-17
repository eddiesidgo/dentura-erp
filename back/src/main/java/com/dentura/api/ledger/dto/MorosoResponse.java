package com.dentura.api.ledger.dto;

import java.math.BigDecimal;

public record MorosoResponse(
		Long patientId,
		String patientName,
		String recordNumber,
		String phone,
		BigDecimal chargesTotal,
		BigDecimal paymentsTotal,
		BigDecimal adjustmentsTotal,
		BigDecimal balance) {
}
