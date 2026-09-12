package com.dentura.api.referral;

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

import com.dentura.api.referral.dto.ReferralSourceRequest;
import com.dentura.api.referral.dto.ReferralSourceResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/referral-sources")
public class ReferralSourceController {

	private final ReferralSourceService sourceService;

	public ReferralSourceController(ReferralSourceService sourceService) {
		this.sourceService = sourceService;
	}

	@GetMapping
	public List<ReferralSourceResponse> list() {
		return sourceService.list();
	}

	@GetMapping("/{id}")
	public ReferralSourceResponse get(@PathVariable Long id) {
		return sourceService.get(id);
	}

	@PostMapping
	public ResponseEntity<ReferralSourceResponse> create(@Valid @RequestBody ReferralSourceRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(sourceService.create(request));
	}

	@PutMapping("/{id}")
	public ReferralSourceResponse update(@PathVariable Long id, @Valid @RequestBody ReferralSourceRequest request) {
		return sourceService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		sourceService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
