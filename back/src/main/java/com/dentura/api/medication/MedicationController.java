package com.dentura.api.medication;

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

import com.dentura.api.medication.dto.MedicationPageResponse;
import com.dentura.api.medication.dto.MedicationRequest;
import com.dentura.api.medication.dto.MedicationResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

	private final MedicationService medicationService;

	public MedicationController(MedicationService medicationService) {
		this.medicationService = medicationService;
	}

	@GetMapping
	public MedicationPageResponse list(
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "50") int size,
			@RequestParam(name = "sort", required = false) String sort,
			@RequestParam(name = "active", required = false) Boolean active) {
		return medicationService.list(query, active, page, size, sort);
	}

	@GetMapping("/{id}")
	public MedicationResponse get(@PathVariable Long id) {
		return medicationService.get(id);
	}

	@PostMapping
	public ResponseEntity<MedicationResponse> create(@Valid @RequestBody MedicationRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(medicationService.create(request));
	}

	@PutMapping("/{id}")
	public MedicationResponse update(@PathVariable Long id, @Valid @RequestBody MedicationRequest request) {
		return medicationService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		medicationService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
