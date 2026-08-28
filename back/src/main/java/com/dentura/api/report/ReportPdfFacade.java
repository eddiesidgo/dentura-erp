package com.dentura.api.report;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dentura.api.report.dto.ClinicLetterhead;
import com.dentura.api.report.dto.StatusSummaryRow;
import com.dentura.api.report.dto.WorkReportRow;

@Service
public class ReportPdfFacade {

	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");

	private final ReportService reportService;
	private final PdfReportService pdfReportService;

	public ReportPdfFacade(ReportService reportService, PdfReportService pdfReportService) {
		this.reportService = reportService;
		this.pdfReportService = pdfReportService;
	}

	@Transactional(readOnly = true)
	public byte[] worksListPdf(
			Long patientId,
			String status,
			Long treatmentId,
			Instant from,
			Instant to,
			String filterSummary) {
		List<WorkReportRow> rows = reportService.worksList(patientId, status, treatmentId, from, to);
		Map<String, Object> model = baseModel("Listado de trabajos", filterSummary);
		model.put("rows", rows);
		model.put("showPatient", true);
		model.put("emptyMessage", "No hay trabajos para los filtros seleccionados.");
		return pdfReportService.render("reports/works-list", model);
	}

	@Transactional(readOnly = true)
	public byte[] worksSummaryPdf(Instant from, Instant to, String filterSummary) {
		List<StatusSummaryRow> rows = reportService.worksSummary(from, to);
		Map<String, Object> model = baseModel("Resumen por estado", filterSummary);
		model.put("rows", rows);
		model.put("emptyMessage", "No hay trabajos en el período seleccionado.");
		return pdfReportService.render("reports/works-summary", model);
	}

	@Transactional(readOnly = true)
	public byte[] patientQuotationPdf(Long patientId) {
		ReportService.PatientQuotation quotation = reportService.quotation(patientId);
		Map<String, Object> model = baseModel(
				"Cotización de tratamiento",
				"Paciente " + quotation.patientName() + " · Exp. " + quotation.recordNumber());
		model.put("quotation", quotation);
		model.put("rows", quotation.rows());
		model.put("emptyMessage", "Este paciente no tiene trabajos en el plan.");
		return pdfReportService.render("reports/patient-quotation", model);
	}

	private Map<String, Object> baseModel(String title, String subtitle) {
		ClinicLetterhead clinic = reportService.letterhead();
		Map<String, Object> model = new HashMap<>();
		model.put("clinic", clinic);
		model.put("title", title);
		model.put("subtitle", subtitle);
		model.put("generatedAt", ReportFormat.dateTime(Instant.now()));
		model.put("year", String.valueOf(LocalDate.now(ZONE).getYear()));
		return model;
	}
}
