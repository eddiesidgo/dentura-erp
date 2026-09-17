package com.dentura.api.inventory.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryItemRequest(
		String sku,
		@NotBlank String name,
		String unit,
		BigDecimal quantity,
		BigDecimal minQuantity,
		Boolean active) {
}
