package com.dentura.api.consent;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.consent.dto.ConsentTemplateRequest;
import com.dentura.api.consent.dto.ConsentTemplateResponse;
import com.dentura.api.consent.dto.PatientConsentRequest;
import com.dentura.api.consent.dto.PatientConsentResponse;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.report.PdfReportService;
import com.dentura.api.report.ReportFormat;
import com.dentura.api.report.ReportService;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class ConsentService {

	private final ConsentTemplateRepository templateRepository;
	private final PatientConsentRepository patientConsentRepository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final PdfReportService pdfReportService;
	private final ReportService reportService;

	public ConsentService(
			ConsentTemplateRepository templateRepository,
			PatientConsentRepository patientConsentRepository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			PdfReportService pdfReportService,
			ReportService reportService) {
		this.templateRepository = templateRepository;
		this.patientConsentRepository = patientConsentRepository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.pdfReportService = pdfReportService;
		this.reportService = reportService;
	}

	@Transactional(readOnly = true)
	public List<ConsentTemplateResponse> listTemplates(boolean activeOnly) {
		permissionService.require(Permission.PATIENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		List<ConsentTemplate> templates = activeOnly
				? templateRepository.findByClinicIdAndActiveTrueOrderByTitleAsc(clinicId)
				: templateRepository.findByClinicIdOrderByTitleAsc(clinicId);
		return templates.stream().map(ConsentTemplateResponse::from).toList();
	}

	@Transactional
	public ConsentTemplateResponse createTemplate(ConsentTemplateRequest request) {
		permissionService.require(Permission.PATIENTS_WRITE);
		ConsentTemplate template = new ConsentTemplate();
		template.setClinicId(clinicAccess.requireClinicId());
		template.setTitle(request.title().trim());
		template.setBodyHtml(request.bodyHtml());
		template.setActive(request.active() == null || request.active());
		return ConsentTemplateResponse.from(templateRepository.save(template));
	}

	@Transactional
	public ConsentTemplateResponse updateTemplate(Long id, ConsentTemplateRequest request) {
		permissionService.require(Permission.PATIENTS_WRITE);
		ConsentTemplate template = requireTemplate(id);
		template.setTitle(request.title().trim());
		template.setBodyHtml(request.bodyHtml());
		if (request.active() != null) {
			template.setActive(request.active());
		}
		return ConsentTemplateResponse.from(templateRepository.save(template));
	}

	@Transactional(readOnly = true)
	public List<PatientConsentResponse> listPatientConsents(Long patientId) {
		permissionService.require(Permission.PATIENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		List<PatientConsent> consents = patientConsentRepository
				.findByClinicIdAndPatientIdOrderByAcceptedAtDesc(clinicId, patientId);
		Map<Long, ConsentTemplate> templates = templateRepository.findAllById(
				consents.stream().map(PatientConsent::getTemplateId).distinct().toList()).stream()
				.collect(Collectors.toMap(ConsentTemplate::getId, Function.identity()));
		return consents.stream()
				.map(consent -> PatientConsentResponse.from(
						consent,
						templates.containsKey(consent.getTemplateId())
								? templates.get(consent.getTemplateId()).getTitle()
								: "Plantilla"))
				.toList();
	}

	@Transactional
	public PatientConsentResponse createPatientConsent(PatientConsentRequest request) {
		permissionService.require(Permission.PATIENTS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		ConsentTemplate template = requireTemplate(request.templateId());
		PatientConsent consent = new PatientConsent();
		consent.setClinicId(clinicId);
		consent.setPatientId(request.patientId());
		consent.setTemplateId(template.getId());
		consent.setSignerName(request.signerName().trim());
		consent.setAcceptedAt(request.acceptedAt() == null ? Instant.now() : request.acceptedAt());
		consent.setNotes(request.notes());
		consent = patientConsentRepository.save(consent);
		return PatientConsentResponse.from(consent, template.getTitle());
	}

	@Transactional(readOnly = true)
	public byte[] consentPdf(Long consentId) {
		permissionService.require(Permission.PATIENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		PatientConsent consent = patientConsentRepository.findByIdAndClinicId(consentId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consentimiento no encontrado"));
		Patient patient = requirePatient(consent.getPatientId(), clinicId);
		ConsentTemplate template = requireTemplate(consent.getTemplateId());
		Map<String, Object> model = new HashMap<>();
		model.put("clinic", reportService.letterhead());
		model.put("title", template.getTitle());
		model.put("subtitle", "Consentimiento informado");
		model.put("generatedAt", ReportFormat.dateTime(Instant.now()));
		model.put("documentDate", ReportFormat.longDate(consent.getAcceptedAt()));
		model.put("patientName", patient.getLastName() + ", " + patient.getFirstName());
		model.put("recordNumber", patient.getRecordNumber());
		model.put("signerName", consent.getSignerName());
		model.put("acceptedAt", ReportFormat.dateTime(consent.getAcceptedAt()));
		model.put("bodyHtml", template.getBodyHtml());
		model.put("notes", consent.getNotes());
		return pdfReportService.render("reports/consent", model);
	}

	private ConsentTemplate requireTemplate(Long id) {
		return templateRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plantilla no encontrada"));
	}

	private Patient requirePatient(Long patientId, Long clinicId) {
		return patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
