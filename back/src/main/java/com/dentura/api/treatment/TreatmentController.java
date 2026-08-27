package com.dentura.api.treatment;

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

import com.dentura.api.treatment.dto.TreatmentPageResponse;
import com.dentura.api.treatment.dto.TreatmentRequest;
import com.dentura.api.treatment.dto.TreatmentResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/treatments")
public class TreatmentController {

	private final TreatmentService treatmentService;

	public TreatmentController(TreatmentService treatmentService) {
		this.treatmentService = treatmentService;
	}

	@GetMapping
	public TreatmentPageResponse list(
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "50") int size,
			@RequestParam(name = "sort", required = false) String sort,
			@RequestParam(name = "active", required = false) Boolean active) {
		return treatmentService.list(query, active, page, size, sort);
	}

	@GetMapping("/{id}")
	public TreatmentResponse get(@PathVariable Long id) {
		return treatmentService.get(id);
	}

	@PostMapping
	public ResponseEntity<TreatmentResponse> create(@Valid @RequestBody TreatmentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(treatmentService.create(request));
	}

	@PutMapping("/{id}")
	public TreatmentResponse update(@PathVariable Long id, @Valid @RequestBody TreatmentRequest request) {
		return treatmentService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		treatmentService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
