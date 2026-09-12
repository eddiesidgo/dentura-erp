package com.dentura.api.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class ReportFormat {

	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");
	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("es-SV"));
	private static final DateTimeFormatter LONG_DATE = DateTimeFormatter
			.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es"));

	private static final DateTimeFormatter DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("es-SV"));

	private ReportFormat() {
	}

	public static String money(BigDecimal value) {
		if (value == null) {
			return "$0.00";
		}
		return String.format(Locale.US, "$%,.2f", value);
	}

	public static String date(Instant instant) {
		if (instant == null) {
			return "—";
		}
		return DATE.format(instant.atZone(ZONE));
	}

	public static String dateTime(Instant instant) {
		if (instant == null) {
			return "—";
		}
		return DATETIME.format(instant.atZone(ZONE));
	}

	public static String longDate(Instant instant) {
		if (instant == null) {
			return "—";
		}
		return LONG_DATE.format(instant.atZone(ZONE));
	}

	public static String statusLabel(String status) {
		return switch (status) {
			case "COMPLETED" -> "Terminado";
			case "REJECTED" -> "No aceptado";
			default -> "Pendiente";
		};
	}

	public static String paymentMethodLabel(String method) {
		if (method == null) {
			return "Otro";
		}
		return switch (method) {
			case "CASH" -> "Efectivo";
			case "CARD" -> "Tarjeta";
			case "TRANSFER" -> "Transferencia";
			default -> "Otro";
		};
	}
}
