package com.dentura.api.smile;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.dentura.api.smile.dto.SmileDesignRequest;
import com.dentura.api.smile.dto.SmileDesignResponse;
import com.dentura.api.smile.dto.SmileSuggestRequest;

import jakarta.validation.Valid;

@RestController
public class SmileDesignController {

	private final SmileDesignService smileDesignService;

	public SmileDesignController(SmileDesignService smileDesignService) {
		this.smileDesignService = smileDesignService;
	}

	@GetMapping("/api/patients/{patientId}/smile-designs")
	public List<SmileDesignResponse> list(@PathVariable Long patientId) {
		return smileDesignService.list(patientId);
	}

	@PostMapping("/api/patients/{patientId}/smile-designs/suggest")
	public Map<String, Object> suggestForPatient(
			@PathVariable Long patientId,
			@Valid @RequestBody SmileSuggestRequest request) {
		return smileDesignService.suggestForPatient(patientId, request);
	}

	@PostMapping("/api/smile-designs")
	public ResponseEntity<SmileDesignResponse> create(@Valid @RequestBody SmileDesignRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(smileDesignService.create(request));
	}

	@GetMapping("/api/smile-designs/{id}")
	public SmileDesignResponse get(@PathVariable Long id) {
		return smileDesignService.get(id);
	}

	@PutMapping("/api/smile-designs/{id}")
	public SmileDesignResponse update(
			@PathVariable Long id,
			@Valid @RequestBody SmileDesignRequest request) {
		return smileDesignService.update(id, request);
	}

	@PostMapping("/api/smile-designs/{id}/suggest")
	public Map<String, Object> suggest(
			@PathVariable Long id,
			@Valid @RequestBody SmileSuggestRequest request) {
		return smileDesignService.suggest(id, request);
	}

	@PostMapping("/api/smile-designs/{id}/export")
	public SmileDesignResponse uploadExport(
			@PathVariable Long id,
			@RequestParam("file") MultipartFile file) {
		return smileDesignService.uploadExport(id, file);
	}

	@GetMapping("/api/smile-designs/{id}/export")
	public ResponseEntity<byte[]> downloadExport(@PathVariable Long id) {
		SmileDesignService.FilePayload payload = smileDesignService.loadExport(id);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.fileName() + "\"")
				.contentType(MediaType.parseMediaType(payload.contentType()))
				.body(payload.bytes());
	}

	@DeleteMapping("/api/smile-designs/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		smileDesignService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
