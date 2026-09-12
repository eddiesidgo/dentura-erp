package com.dentura.api.photo;

import java.time.Instant;
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

import com.dentura.api.photo.dto.PhotoResponse;

@RestController
public class PhotoController {

	private final PhotoService photoService;

	public PhotoController(PhotoService photoService) {
		this.photoService = photoService;
	}

	@GetMapping("/api/patients/{patientId}/photos")
	public List<PhotoResponse> list(
			@PathVariable Long patientId,
			@RequestParam(required = false) String category) {
		return photoService.list(patientId, category);
	}

	@PostMapping("/api/patients/{patientId}/photos")
	public ResponseEntity<PhotoResponse> create(
			@PathVariable Long patientId,
			@RequestParam("file") MultipartFile file,
			@RequestParam String category,
			@RequestParam(required = false) String caption,
			@RequestParam(required = false) Instant takenAt) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(photoService.create(patientId, file, category, caption, takenAt));
	}

	@GetMapping("/api/photos/{id}")
	public PhotoResponse get(@PathVariable Long id) {
		return photoService.get(id);
	}

	@GetMapping("/api/photos/{id}/file")
	public ResponseEntity<byte[]> file(@PathVariable Long id) {
		PhotoService.FilePayload payload = photoService.loadFile(id);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + payload.fileName() + "\"")
				.contentType(MediaType.parseMediaType(payload.contentType()))
				.body(payload.bytes());
	}

	@DeleteMapping("/api/photos/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		photoService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
