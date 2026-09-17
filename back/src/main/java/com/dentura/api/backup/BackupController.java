package com.dentura.api.backup;

import java.nio.file.Path;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

	private final BackupService backupService;

	public BackupController(BackupService backupService) {
		this.backupService = backupService;
	}

	@PostMapping("/export")
	public BackupExportResponse export() {
		return backupService.exportZip();
	}

	@GetMapping("/export/{exportId}")
	public ResponseEntity<Resource> download(@PathVariable String exportId) {
		Path path = backupService.requireExportFile(exportId);
		Resource resource = new FileSystemResource(path);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName() + "\"")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(resource);
	}
}
