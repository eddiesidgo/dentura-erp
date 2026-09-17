package com.dentura.api.inventory;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

	List<InventoryItem> findByClinicIdOrderByNameAsc(Long clinicId);

	Optional<InventoryItem> findByIdAndClinicId(Long id, Long clinicId);

	Optional<InventoryItem> findByClinicIdAndSku(Long clinicId, String sku);
}
