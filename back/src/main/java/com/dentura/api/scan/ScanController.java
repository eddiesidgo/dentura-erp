package com.dentura.api.scan;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.dentura.api.scan.dto.ScanResponse;

@RestController
public class ScanController {

	private final ScanService scanService;

	public ScanController(ScanService scanService) {
		this.scanService = scanService;
	}

	@GetMapping("/api/patients/{patientId}/scans")
	public List<ScanResponse> list(
			@PathVariable Long patientId,
			@RequestParam(required = false) String arch) {
		return scanService.list(patientId, arch);
	}

	@PostMapping("/api/patients/{patientId}/scans")
	public ResponseEntity<ScanResponse> create(
			@PathVariable Long patientId,
			@RequestParam("file") MultipartFile file,
			@RequestParam String arch,
			@RequestParam(required = false) String caption) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(scanService.create(patientId, file, arch, caption));
	}

	@GetMapping("/api/scans/{id}")
	public ScanResponse get(@PathVariable Long id) {
		return scanService.get(id);
	}

	@GetMapping("/api/scans/{id}/file")
	public ResponseEntity<byte[]> file(@PathVariable Long id) {
		ScanService.FilePayload payload = scanService.loadFile(id);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + payload.fileName() + "\"")
				.contentType(MediaType.parseMediaType(payload.contentType()))
				.body(payload.bytes());
	}

	@DeleteMapping("/api/scans/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		scanService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
