package com.dentura.api.odontogram.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OdontogramEntryRequest(
		@NotNull(message = "El paciente es obligatorio") Long patientId,
		@NotBlank(message = "La pieza dental es obligatoria") @Size(max = 10) String tooth,
		@Size(max = 20) String surfaces,
		@NotBlank(message = "La condición es obligatoria") @Size(max = 40) String condition,
		@Size(max = 20) String status,
		Long workId,
		String notes) {

	public OdontogramEntryRequest {
		tooth = blankToNull(tooth);
		surfaces = blankToNull(surfaces);
		condition = blankToNull(condition);
		status = blankToNull(status);
		notes = blankToNull(notes);
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
