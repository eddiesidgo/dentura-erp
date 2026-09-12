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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.prescription.dto.PrescriptionRequest;
import com.dentura.api.prescription.dto.PrescriptionResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

	private final PrescriptionService prescriptionService;

	public PrescriptionController(PrescriptionService prescriptionService) {
		this.prescriptionService = prescriptionService;
	}

	@GetMapping
	public List<PrescriptionResponse> list(@RequestParam(required = false) Long patientId) {
		return prescriptionService.list(patientId);
	}

	@GetMapping("/{id}")
	public PrescriptionResponse get(@PathVariable Long id) {
		return prescriptionService.get(id);
	}

	@PostMapping
	public ResponseEntity<PrescriptionResponse> create(@Valid @RequestBody PrescriptionRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionService.create(request));
	}

	@PutMapping("/{id}")
	public PrescriptionResponse update(@PathVariable Long id, @Valid @RequestBody PrescriptionRequest request) {
		return prescriptionService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		prescriptionService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
