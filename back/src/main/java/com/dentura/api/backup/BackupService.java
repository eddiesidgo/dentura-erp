package com.dentura.api.backup;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class BackupService {

	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");
	private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZONE);

	private final PermissionService permissionService;
	private final Environment environment;
	private final Path uploadsDir;
	private final Map<String, Path> exports = new ConcurrentHashMap<>();

	public BackupService(
			PermissionService permissionService,
			Environment environment,
			@Value("${dentura.storage.uploads-dir:./data/uploads}") String uploadsDir) {
		this.permissionService = permissionService;
		this.environment = environment;
		this.uploadsDir = Path.of(uploadsDir).toAbsolutePath().normalize();
	}

	public BackupExportResponse exportZip() {
		permissionService.require(Permission.CLINIC_MANAGE);
		try {
			Files.createDirectories(Path.of("data/backups"));
			String id = UUID.randomUUID().toString().replace("-", "");
			String filename = "dentura-backup-" + TS.format(Instant.now()) + ".zip";
			Path zipPath = Path.of("data/backups", filename);
			String dbUrl = environment.getProperty("spring.datasource.url", "");
			String dbHint;
			Path sqliteFile = null;
			if (dbUrl.startsWith("jdbc:sqlite:")) {
				String path = dbUrl.substring("jdbc:sqlite:".length());
				sqliteFile = Path.of(path).toAbsolutePath().normalize();
				dbHint = "SQLite file included when present: " + sqliteFile;
			} else {
				dbHint = "Database URL: " + dbUrl
						+ " — dump PostgreSQL separately (pg_dump) before restoring.";
			}

			try (OutputStream fileOut = Files.newOutputStream(zipPath);
					ZipOutputStream zip = new ZipOutputStream(fileOut)) {
				String note = """
						Dentura ERP backup package
						Created: %s
						Uploads directory (host path): %s
						%s

						Restore notes:
						- Extract this ZIP on the server/desktop host.
						- Copy uploads contents back to dentura.storage.uploads-dir.
						- For SQLite: replace dentura.db with the included copy (stop the app first).
						- For PostgreSQL: restore from your own pg_dump; this ZIP only stores metadata.
						""".formatted(Instant.now(), uploadsDir, dbHint);
				zip.putNextEntry(new ZipEntry("README-BACKUP.txt"));
				zip.write(note.getBytes(StandardCharsets.UTF_8));
				zip.closeEntry();

				zip.putNextEntry(new ZipEntry("metadata/uploads-path.txt"));
				zip.write(uploadsDir.toString().getBytes(StandardCharsets.UTF_8));
				zip.closeEntry();

				if (sqliteFile != null && Files.isRegularFile(sqliteFile)) {
					zip.putNextEntry(new ZipEntry("database/dentura.db"));
					Files.copy(sqliteFile, zip);
					zip.closeEntry();
				}
			}

			exports.put(id, zipPath);
			long size = Files.size(zipPath);
			return new BackupExportResponse(
					id,
					filename,
					"ZIP con nota de restauración, ruta de uploads y copia SQLite si aplica.",
					uploadsDir.toString(),
					dbHint,
					Instant.now(),
					size);
		} catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo generar el backup", ex);
		}
	}

	public Path requireExportFile(String exportId) {
		permissionService.require(Permission.CLINIC_MANAGE);
		Path path = exports.get(exportId);
		if (path == null || !Files.isRegularFile(path)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exportación no encontrada");
		}
		return path;
	}
}
