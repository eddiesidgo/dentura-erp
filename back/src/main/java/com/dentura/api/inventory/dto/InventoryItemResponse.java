package com.dentura.api.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.dentura.api.inventory.InventoryItem;

public record InventoryItemResponse(
		Long id,
		Long clinicId,
		String sku,
		String name,
		String unit,
		BigDecimal quantity,
		BigDecimal minQuantity,
		boolean active,
		boolean lowStock,
		Instant createdAt,
		Instant updatedAt) {

	public static InventoryItemResponse from(InventoryItem item) {
		boolean low = item.getQuantity().compareTo(item.getMinQuantity()) <= 0;
		return new InventoryItemResponse(
				item.getId(),
				item.getClinicId(),
				item.getSku(),
				item.getName(),
				item.getUnit(),
				item.getQuantity(),
				item.getMinQuantity(),
				item.isActive(),
				low,
				item.getCreatedAt(),
				item.getUpdatedAt());
	}
}
