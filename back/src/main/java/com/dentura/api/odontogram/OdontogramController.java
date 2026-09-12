package com.dentura.api.odontogram;

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

import com.dentura.api.odontogram.dto.OdontogramEntryRequest;
import com.dentura.api.odontogram.dto.OdontogramEntryResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/odontogram")
public class OdontogramController {

	private final OdontogramService odontogramService;

	public OdontogramController(OdontogramService odontogramService) {
		this.odontogramService = odontogramService;
	}

	@GetMapping
	public List<OdontogramEntryResponse> list(@RequestParam(required = false) Long patientId) {
		return odontogramService.list(patientId);
	}

	@GetMapping("/{id}")
	public OdontogramEntryResponse get(@PathVariable Long id) {
		return odontogramService.get(id);
	}

	@PostMapping
	public ResponseEntity<OdontogramEntryResponse> create(@Valid @RequestBody OdontogramEntryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(odontogramService.create(request));
	}

	@PutMapping("/{id}")
	public OdontogramEntryResponse update(
			@PathVariable Long id,
			@Valid @RequestBody OdontogramEntryRequest request) {
		return odontogramService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		odontogramService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
