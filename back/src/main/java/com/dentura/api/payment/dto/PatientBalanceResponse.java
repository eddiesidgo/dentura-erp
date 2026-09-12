package com.dentura.api.payment.dto;

import java.math.BigDecimal;

public record PatientBalanceResponse(
		Long patientId,
		BigDecimal worksTotal,
		BigDecimal paidTotal,
		BigDecimal balance) {
}
