package com.dentura.api.ledger.dto;

import java.math.BigDecimal;
import java.util.List;

import com.dentura.api.ledger.dto.LedgerEntryResponse;

public record LedgerStatementResponse(
		Long patientId,
		String patientName,
		String recordNumber,
		BigDecimal chargesTotal,
		BigDecimal paymentsTotal,
		BigDecimal adjustmentsTotal,
		BigDecimal balance,
		List<LedgerEntryResponse> entries) {
}
