package com.dentura.api.report.dto;

public record GenericReportRow(
		String label,
		String value,
		String secondary) {

	public static GenericReportRow of(String label, String value) {
		return new GenericReportRow(label, value, null);
	}

	public static GenericReportRow of(String label, String value, String secondary) {
		return new GenericReportRow(label, value, secondary);
	}

	public static GenericReportRow count(String label, long count) {
		return new GenericReportRow(label, String.valueOf(count), null);
	}
}
