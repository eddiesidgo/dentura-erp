package com.dentura.api.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.config.StorageProperties;

@Component
public class PatientFileStorage {

	private static final long MAX_BYTES = 10 * 1024 * 1024;
	private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp");

	private final Path root;

	public PatientFileStorage(StorageProperties properties) {
		this.root = Path.of(properties.getUploadsDir()).toAbsolutePath().normalize();
	}

	public StoredFile save(Long clinicId, Long patientId, String category, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe enviar un archivo de imagen");
		}
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato no permitido. Use PNG, JPG o WEBP");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen no puede superar 10 MB");
		}
		String originalName = file.getOriginalFilename() == null ? "photo" : file.getOriginalFilename();
		String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
		if (safeName.length() > 120) {
			safeName = safeName.substring(safeName.length() - 120);
		}
		String storedName = UUID.randomUUID() + "_" + safeName;
		String relativePath = "clinics/" + clinicId + "/patients/" + patientId + "/" + sanitizeCategory(category)
				+ "/" + storedName;
		Path target = root.resolve(relativePath).normalize();
		if (!target.startsWith(root)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo inválida");
		}
		try {
			Files.createDirectories(target.getParent());
			try (InputStream input = file.getInputStream()) {
				Files.copy(input, target);
			}
			return new StoredFile(relativePath, safeName, contentType.toLowerCase(Locale.ROOT), file.getSize());
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el archivo");
		}
	}

	public byte[] load(String relativePath) {
		Path target = resolveSafe(relativePath);
		try {
			if (!Files.isRegularFile(target)) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
			}
			return Files.readAllBytes(target);
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer el archivo");
		}
	}

	public void delete(String relativePath) {
		if (relativePath == null || relativePath.isBlank()) {
			return;
		}
		Path target = resolveSafe(relativePath);
		try {
			Files.deleteIfExists(target);
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo eliminar el archivo");
		}
	}

	private Path resolveSafe(String relativePath) {
		Path target = root.resolve(relativePath).normalize();
		if (!target.startsWith(root)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo inválida");
		}
		return target;
	}

	private String sanitizeCategory(String category) {
		if (category == null || category.isBlank()) {
			return "OTHER";
		}
		return category.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
	}

	public record StoredFile(String relativePath, String originalFileName, String contentType, long sizeBytes) {
	}
}
