package com.dentura.api.report;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");

	private final ReportPdfFacade reportPdfFacade;

	public ReportController(ReportPdfFacade reportPdfFacade) {
		this.reportPdfFacade = reportPdfFacade;
	}

	@GetMapping(value = "/works/list.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> worksListPdf(
			@RequestParam(required = false) Long patientId,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) Long treatmentId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		Instant fromInstant = startOfDay(from);
		Instant toInstant = endExclusive(to);
		String summary = buildWorksFilterSummary(status, from, to);
		byte[] pdf = reportPdfFacade.worksListPdf(patientId, status, treatmentId, fromInstant, toInstant, summary);
		return pdfResponse("trabajos-listado.pdf", pdf);
	}

	@GetMapping(value = "/works/summary.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> worksSummaryPdf(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		Instant fromInstant = startOfDay(from);
		Instant toInstant = endExclusive(to);
		String summary = buildDateSummary(from, to);
		byte[] pdf = reportPdfFacade.worksSummaryPdf(fromInstant, toInstant, summary);
		return pdfResponse("trabajos-resumen.pdf", pdf);
	}

	@GetMapping(value = "/patients/{patientId}/quotation.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> patientQuotationPdf(@PathVariable Long patientId) {
		byte[] pdf = reportPdfFacade.patientQuotationPdf(patientId);
		return pdfResponse("cotizacion-paciente-" + patientId + ".pdf", pdf);
	}

	private ResponseEntity<byte[]> pdfResponse(String filename, byte[] pdf) {
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}

	private Instant startOfDay(LocalDate date) {
		if (date == null) {
			return null;
		}
		return date.atStartOfDay(ZONE).toInstant();
	}

	private Instant endExclusive(LocalDate date) {
		if (date == null) {
			return null;
		}
		return date.plusDays(1).atStartOfDay(ZONE).toInstant();
	}

	private String buildDateSummary(LocalDate from, LocalDate to) {
		if (from == null && to == null) {
			return "Todos los períodos";
		}
		if (from != null && to != null) {
			return "Del " + ReportFormat.date(from.atStartOfDay(ZONE).toInstant())
					+ " al " + ReportFormat.date(to.atStartOfDay(ZONE).toInstant());
		}
		if (from != null) {
			return "Desde " + ReportFormat.date(from.atStartOfDay(ZONE).toInstant());
		}
		return "Hasta " + ReportFormat.date(to.atStartOfDay(ZONE).toInstant());
	}

	private String buildWorksFilterSummary(String status, LocalDate from, LocalDate to) {
		StringBuilder builder = new StringBuilder(buildDateSummary(from, to));
		if (status != null && !status.isBlank()) {
			builder.append(" · Estado: ").append(ReportFormat.statusLabel(status));
		}
		return builder.toString();
	}
}
