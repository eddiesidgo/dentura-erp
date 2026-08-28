package com.dentura.api.clinic;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.config.StorageProperties;

@Component
public class ClinicLogoStorage {

	private static final long MAX_BYTES = 2 * 1024 * 1024;
	private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp");

	private final Path root;

	public ClinicLogoStorage(StorageProperties properties) {
		this.root = Path.of(properties.getUploadsDir()).toAbsolutePath().normalize();
	}

	public String logoApiPath(Long clinicId) {
		return "/api/clinics/" + clinicId + "/logo";
	}

	public void save(Long clinicId, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe enviar un archivo de imagen");
		}
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato no permitido. Use PNG, JPG o WEBP");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El logo no puede superar 2 MB");
		}
		try {
			Path dir = clinicDir(clinicId);
			Files.createDirectories(dir);
			deleteExisting(dir);
			String extension = extensionFor(contentType);
			Path target = dir.resolve("logo." + extension);
			try (InputStream input = file.getInputStream()) {
				Files.copy(input, target);
			}
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el logo");
		}
	}

	public Optional<StoredLogo> load(Long clinicId) {
		Path dir = clinicDir(clinicId);
		if (!Files.isDirectory(dir)) {
			return Optional.empty();
		}
		try (var stream = Files.list(dir)) {
			return stream
					.filter(path -> path.getFileName().toString().startsWith("logo."))
					.findFirst()
					.map(path -> {
						try {
							String contentType = Files.probeContentType(path);
							if (contentType == null) {
								contentType = "image/png";
							}
							return new StoredLogo(Files.readAllBytes(path), contentType);
						} catch (IOException ex) {
							throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer el logo");
						}
					});
		} catch (IOException ex) {
			return Optional.empty();
		}
	}

	public void delete(Long clinicId) {
		Path dir = clinicDir(clinicId);
		if (!Files.isDirectory(dir)) {
			return;
		}
		try {
			deleteExisting(dir);
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo eliminar el logo");
		}
	}

	private Path clinicDir(Long clinicId) {
		return root.resolve("clinics").resolve(String.valueOf(clinicId));
	}

	private void deleteExisting(Path dir) throws IOException {
		if (!Files.isDirectory(dir)) {
			return;
		}
		try (var stream = Files.list(dir)) {
			for (Path path : stream.toList()) {
				Files.deleteIfExists(path);
			}
		}
	}

	private String extensionFor(String contentType) {
		return switch (contentType.toLowerCase(Locale.ROOT)) {
			case "image/jpeg" -> "jpg";
			case "image/webp" -> "webp";
			default -> "png";
		};
	}

	public record StoredLogo(byte[] bytes, String contentType) {
	}
}
