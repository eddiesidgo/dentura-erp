package com.dentura.api.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.dentura.api.inventory.InventoryMovement;

public record InventoryMovementResponse(
		Long id,
		Long clinicId,
		Long itemId,
		String type,
		BigDecimal quantity,
		String note,
		Instant createdAt) {

	public static InventoryMovementResponse from(InventoryMovement movement) {
		return new InventoryMovementResponse(
				movement.getId(),
				movement.getClinicId(),
				movement.getItemId(),
				movement.getType(),
				movement.getQuantity(),
				movement.getNote(),
				movement.getCreatedAt());
	}
}
