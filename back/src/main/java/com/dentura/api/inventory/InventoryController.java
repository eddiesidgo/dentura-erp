package com.dentura.api.inventory;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.inventory.dto.InventoryItemRequest;
import com.dentura.api.inventory.dto.InventoryItemResponse;
import com.dentura.api.inventory.dto.InventoryMovementRequest;
import com.dentura.api.inventory.dto.InventoryMovementResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

	private final InventoryService inventoryService;

	public InventoryController(InventoryService inventoryService) {
		this.inventoryService = inventoryService;
	}

	@GetMapping
	public List<InventoryItemResponse> list() {
		return inventoryService.listItems();
	}

	@PostMapping
	public ResponseEntity<InventoryItemResponse> create(@Valid @RequestBody InventoryItemRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createItem(request));
	}

	@PutMapping("/{id}")
	public InventoryItemResponse update(@PathVariable Long id, @Valid @RequestBody InventoryItemRequest request) {
		return inventoryService.updateItem(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		inventoryService.deleteItem(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/movements")
	public List<InventoryMovementResponse> movements(@RequestParam Long itemId) {
		return inventoryService.listMovements(itemId);
	}

	@PostMapping("/movements")
	public ResponseEntity<InventoryMovementResponse> move(@Valid @RequestBody InventoryMovementRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.move(request));
	}
}
