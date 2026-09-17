package com.dentura.api.inventory;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

	List<InventoryMovement> findByClinicIdAndItemIdOrderByCreatedAtDesc(Long clinicId, Long itemId);
}
