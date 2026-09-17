package com.dentura.api.backup;

import java.time.Instant;

public record BackupExportResponse(
		String exportId,
		String filename,
		String note,
		String uploadsDir,
		String databaseHint,
		Instant createdAt,
		long sizeBytes) {
}
