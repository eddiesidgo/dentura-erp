package com.dentura.api.work.dto;

import java.math.BigDecimal;

public record WorkTreatmentSummaryResponse(
		Long treatmentId,
		String treatmentCode,
		String treatmentName,
		long totalWorks,
		long pendingCount,
		long completedCount,
		long rejectedCount,
		int quantityTotal,
		BigDecimal amountTotal,
		BigDecimal completedAmount) {
}
