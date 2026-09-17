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

	private static final long IMAGE_MAX_BYTES = 10 * 1024 * 1024;
	private static final long MESH_MAX_BYTES = 100 * 1024 * 1024;
	private static final long DESIGN_MAX_BYTES = 100 * 1024 * 1024;

	private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/webp");
	private static final Set<String> MESH_TYPES = Set.of(
			"model/stl",
			"model/ply",
			"application/sla",
			"application/vnd.ms-pki.stl",
			"application/octet-stream",
			"text/plain");
	private static final Set<String> MESH_EXTENSIONS = Set.of(".stl", ".ply");
	private static final Set<String> DESIGN_EXTENSIONS = Set.of(".stl", ".ply", ".3mf");

	private final Path root;

	public PatientFileStorage(StorageProperties properties) {
		this.root = Path.of(properties.getUploadsDir()).toAbsolutePath().normalize();
	}

	public StoredFile save(Long clinicId, Long patientId, String category, MultipartFile file) {
		return save(clinicId, patientId, category, file, StorageKind.IMAGE);
	}

	public StoredFile save(
			Long clinicId,
			Long patientId,
			String category,
			MultipartFile file,
			StorageKind kind) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emptyMessage(kind));
		}
		String originalName = file.getOriginalFilename() == null ? defaultName(kind) : file.getOriginalFilename();
		String contentType = normalizeContentType(file.getContentType(), originalName, kind);
		validate(file, originalName, contentType, kind);

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
			return new StoredFile(relativePath, safeName, contentType, file.getSize());
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el archivo");
		}
	}

	public StoredFile saveBytes(
			Long clinicId,
			Long patientId,
			String category,
			String fileName,
			String contentType,
			byte[] bytes,
			StorageKind kind) {
		if (bytes == null || bytes.length == 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emptyMessage(kind));
		}
		String safeName = (fileName == null ? defaultName(kind) : fileName).replaceAll("[^a-zA-Z0-9._-]", "_");
		if (safeName.length() > 120) {
			safeName = safeName.substring(safeName.length() - 120);
		}
		String normalizedType = normalizeContentType(contentType, safeName, kind);
		validateSize(bytes.length, kind);
		validateExtension(safeName, kind);

		String storedName = UUID.randomUUID() + "_" + safeName;
		String relativePath = "clinics/" + clinicId + "/patients/" + patientId + "/" + sanitizeCategory(category)
				+ "/" + storedName;
		Path target = root.resolve(relativePath).normalize();
		if (!target.startsWith(root)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo inválida");
		}
		try {
			Files.createDirectories(target.getParent());
			Files.write(target, bytes);
			return new StoredFile(relativePath, safeName, normalizedType, bytes.length);
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

	private void validate(MultipartFile file, String originalName, String contentType, StorageKind kind) {
		validateSize(file.getSize(), kind);
		validateExtension(originalName, kind);
		switch (kind) {
			case IMAGE -> {
				if (!IMAGE_TYPES.contains(contentType)) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato no permitido. Use PNG, JPG o WEBP");
				}
			}
			case MESH -> {
				if (!MESH_TYPES.contains(contentType) && !hasAllowedExtension(originalName, MESH_EXTENSIONS)) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato no permitido. Use STL o PLY");
				}
			}
			case DESIGN_EXPORT -> {
				if (!hasAllowedExtension(originalName, DESIGN_EXTENSIONS)) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de exportación inválido");
				}
			}
		}
	}

	private void validateSize(long size, StorageKind kind) {
		long max = switch (kind) {
			case IMAGE -> IMAGE_MAX_BYTES;
			case MESH -> MESH_MAX_BYTES;
			case DESIGN_EXPORT -> DESIGN_MAX_BYTES;
		};
		if (size > max) {
			String unit = kind == StorageKind.IMAGE ? "10 MB" : "100 MB";
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no puede superar " + unit);
		}
	}

	private void validateExtension(String fileName, StorageKind kind) {
		Set<String> allowed = switch (kind) {
			case IMAGE -> Set.of(".png", ".jpg", ".jpeg", ".webp");
			case MESH -> MESH_EXTENSIONS;
			case DESIGN_EXPORT -> DESIGN_EXTENSIONS;
		};
		if (kind == StorageKind.IMAGE) {
			return;
		}
		if (!hasAllowedExtension(fileName, allowed)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extensión de archivo no permitida");
		}
	}

	private static boolean hasAllowedExtension(String fileName, Set<String> extensions) {
		String lower = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
		return extensions.stream().anyMatch(lower::endsWith);
	}

	private static String normalizeContentType(String contentType, String fileName, StorageKind kind) {
		String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
		if (kind == StorageKind.MESH || kind == StorageKind.DESIGN_EXPORT) {
			if (lowerName.endsWith(".stl")) {
				return "model/stl";
			}
			if (lowerName.endsWith(".ply")) {
				return "model/ply";
			}
			if (lowerName.endsWith(".3mf")) {
				return "model/3mf";
			}
		}
		if (contentType == null || contentType.isBlank()) {
			return switch (kind) {
				case IMAGE -> "application/octet-stream";
				case MESH, DESIGN_EXPORT -> "application/octet-stream";
			};
		}
		return contentType.toLowerCase(Locale.ROOT);
	}

	private static String emptyMessage(StorageKind kind) {
		return switch (kind) {
			case IMAGE -> "Debe enviar un archivo de imagen";
			case MESH -> "Debe enviar un archivo de scan (STL/PLY)";
			case DESIGN_EXPORT -> "Debe enviar el archivo de exportación";
		};
	}

	private static String defaultName(StorageKind kind) {
		return switch (kind) {
			case IMAGE -> "photo";
			case MESH -> "scan.stl";
			case DESIGN_EXPORT -> "design.stl";
		};
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
