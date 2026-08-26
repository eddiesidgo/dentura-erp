package com.dentura.api.patient;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.patient.dto.PatientPageResponse;
import com.dentura.api.patient.dto.PatientRequest;
import com.dentura.api.patient.dto.PatientResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

	private final PatientService patientService;

	public PatientController(PatientService patientService) {
		this.patientService = patientService;
	}

	@GetMapping
	public PatientPageResponse list(
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "10") int size,
			@RequestParam(name = "sort", required = false) String sort,
			@RequestParam(name = "active", required = false) Boolean active) {
		return patientService.list(query, active, page, size, sort);
	}

	@GetMapping("/{id}")
	public PatientResponse get(@PathVariable Long id) {
		return patientService.get(id);
	}

	@PostMapping
	public ResponseEntity<PatientResponse> create(@Valid @RequestBody PatientRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(patientService.create(request));
	}

	@PutMapping("/{id}")
	public PatientResponse update(@PathVariable Long id, @Valid @RequestBody PatientRequest request) {
		return patientService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		patientService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
