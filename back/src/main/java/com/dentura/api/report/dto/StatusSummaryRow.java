package com.dentura.api.report.dto;

import java.math.BigDecimal;

public record StatusSummaryRow(
		String status,
		String statusLabel,
		long count,
		String total) {

	public static StatusSummaryRow of(String status, String statusLabel, long count, BigDecimal total) {
		return new StatusSummaryRow(
				status,
				statusLabel,
				count,
				com.dentura.api.report.ReportFormat.money(total));
	}
}
