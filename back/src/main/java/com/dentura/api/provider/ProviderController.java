package com.dentura.api.provider;

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

import com.dentura.api.provider.dto.ProviderRequest;
import com.dentura.api.provider.dto.ProviderResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/providers")
public class ProviderController {

	private final ProviderService providerService;

	public ProviderController(ProviderService providerService) {
		this.providerService = providerService;
	}

	@GetMapping
	public List<ProviderResponse> list(@RequestParam(name = "activeOnly", required = false) Boolean activeOnly) {
		return providerService.list(activeOnly);
	}

	@PostMapping
	public ResponseEntity<ProviderResponse> create(@Valid @RequestBody ProviderRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(providerService.create(request));
	}

	@PutMapping("/{id}")
	public ProviderResponse update(@PathVariable Long id, @Valid @RequestBody ProviderRequest request) {
		return providerService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		providerService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
