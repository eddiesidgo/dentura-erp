package com.dentura.api.work;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
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

import com.dentura.api.work.dto.WorkRequest;
import com.dentura.api.work.dto.WorkResponse;
import com.dentura.api.work.dto.WorkTreatmentSummaryResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/works")
public class WorkController {

	private final WorkService workService;

	public WorkController(WorkService workService) {
		this.workService = workService;
	}

	@GetMapping
	public List<WorkResponse> list(
			@RequestParam(required = false) Long patientId,
			@RequestParam(required = false) Long treatmentId,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return workService.list(patientId, treatmentId, status, from, to);
	}

	@GetMapping("/summary-by-treatment")
	public List<WorkTreatmentSummaryResponse> summaryByTreatment(
			@RequestParam(required = false) Long patientId,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return workService.summaryByTreatment(patientId, status, from, to);
	}

	@GetMapping("/{id}")
	public WorkResponse get(@PathVariable Long id) {
		return workService.get(id);
	}

	@PostMapping
	public ResponseEntity<WorkResponse> create(@Valid @RequestBody WorkRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(workService.create(request));
	}

	@PutMapping("/{id}")
	public WorkResponse update(@PathVariable Long id, @Valid @RequestBody WorkRequest request) {
		return workService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		workService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
