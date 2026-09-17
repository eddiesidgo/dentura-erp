package com.dentura.api.smile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SmileDesignRequest(
		@NotNull Long patientId,
		Long scanId,
		@NotBlank @Size(max = 160) String name,
		@NotBlank String designJson,
		@Size(max = 4000) String notes) {
}
