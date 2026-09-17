package com.dentura.api.smile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SmileSuggestRequest(
		@NotBlank @Pattern(regexp = "OVAL|SQUARE|TRIANGULAR|HOLLYWOOD") String style,
		Double archWidth,
		Double toothLength,
		Double midlineOffset) {
}
