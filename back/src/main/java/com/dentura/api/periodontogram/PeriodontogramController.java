package com.dentura.api.periodontogram;

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

import com.dentura.api.periodontogram.dto.PeriodontogramEntryRequest;
import com.dentura.api.periodontogram.dto.PeriodontogramEntryResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/periodontogram")
public class PeriodontogramController {

	private final PeriodontogramService periodontogramService;

	public PeriodontogramController(PeriodontogramService periodontogramService) {
		this.periodontogramService = periodontogramService;
	}

	@GetMapping
	public List<PeriodontogramEntryResponse> list(@RequestParam Long patientId) {
		return periodontogramService.list(patientId);
	}

	@PostMapping
	public ResponseEntity<PeriodontogramEntryResponse> create(@Valid @RequestBody PeriodontogramEntryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(periodontogramService.create(request));
	}

	@PutMapping("/{id}")
	public PeriodontogramEntryResponse update(
			@PathVariable Long id,
			@Valid @RequestBody PeriodontogramEntryRequest request) {
		return periodontogramService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		periodontogramService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
