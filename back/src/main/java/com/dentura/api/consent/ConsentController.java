package com.dentura.api.consent;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.consent.dto.ConsentTemplateRequest;
import com.dentura.api.consent.dto.ConsentTemplateResponse;
import com.dentura.api.consent.dto.PatientConsentRequest;
import com.dentura.api.consent.dto.PatientConsentResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/consents")
public class ConsentController {

	private final ConsentService consentService;

	public ConsentController(ConsentService consentService) {
		this.consentService = consentService;
	}

	@GetMapping("/templates")
	public List<ConsentTemplateResponse> templates(
			@RequestParam(name = "activeOnly", required = false, defaultValue = "true") boolean activeOnly) {
		return consentService.listTemplates(activeOnly);
	}

	@PostMapping("/templates")
	public ResponseEntity<ConsentTemplateResponse> createTemplate(
			@Valid @RequestBody ConsentTemplateRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(consentService.createTemplate(request));
	}

	@PutMapping("/templates/{id}")
	public ConsentTemplateResponse updateTemplate(
			@PathVariable Long id,
			@Valid @RequestBody ConsentTemplateRequest request) {
		return consentService.updateTemplate(id, request);
	}

	@GetMapping
	public List<PatientConsentResponse> list(@RequestParam Long patientId) {
		return consentService.listPatientConsents(patientId);
	}

	@PostMapping
	public ResponseEntity<PatientConsentResponse> create(@Valid @RequestBody PatientConsentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(consentService.createPatientConsent(request));
	}

	@GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
		byte[] pdf = consentService.consentPdf(id);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"consentimiento-" + id + ".pdf\"")
				.contentType(MediaType.APPLICATION_PDF)
				.body(pdf);
	}
}
