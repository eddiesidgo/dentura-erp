package com.dentura.api.prescription;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.prescription.dto.PrescriptionTemplateRequest;
import com.dentura.api.prescription.dto.PrescriptionTemplateResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/prescription-templates")
public class PrescriptionTemplateController {

	private final PrescriptionTemplateService templateService;

	public PrescriptionTemplateController(PrescriptionTemplateService templateService) {
		this.templateService = templateService;
	}

	@GetMapping
	public List<PrescriptionTemplateResponse> list() {
		return templateService.list();
	}

	@GetMapping("/{id}")
	public PrescriptionTemplateResponse get(@PathVariable Long id) {
		return templateService.get(id);
	}

	@PostMapping
	public ResponseEntity<PrescriptionTemplateResponse> create(@Valid @RequestBody PrescriptionTemplateRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(templateService.create(request));
	}

	@PutMapping("/{id}")
	public PrescriptionTemplateResponse update(
			@PathVariable Long id,
			@Valid @RequestBody PrescriptionTemplateRequest request) {
		return templateService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		templateService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
