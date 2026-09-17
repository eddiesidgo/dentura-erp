package com.dentura.api.consent.dto;

import jakarta.validation.constraints.NotBlank;

public record ConsentTemplateRequest(
		@NotBlank String title,
		@NotBlank String bodyHtml,
		Boolean active) {
}
