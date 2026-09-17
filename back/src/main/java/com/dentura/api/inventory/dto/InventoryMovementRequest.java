package com.dentura.api.inventory.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryMovementRequest(
		@NotNull Long itemId,
		@NotBlank String type,
		@NotNull BigDecimal quantity,
		String note) {
}
