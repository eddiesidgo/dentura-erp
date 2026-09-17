package com.dentura.api.inventory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.inventory.dto.InventoryItemRequest;
import com.dentura.api.inventory.dto.InventoryItemResponse;
import com.dentura.api.inventory.dto.InventoryMovementRequest;
import com.dentura.api.inventory.dto.InventoryMovementResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class InventoryService {

	private static final Set<String> MOVEMENT_TYPES = Set.of(
			InventoryMovement.IN, InventoryMovement.OUT, InventoryMovement.ADJUST);

	private final InventoryItemRepository itemRepository;
	private final InventoryMovementRepository movementRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public InventoryService(
			InventoryItemRepository itemRepository,
			InventoryMovementRepository movementRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.itemRepository = itemRepository;
		this.movementRepository = movementRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<InventoryItemResponse> listItems() {
		permissionService.require(Permission.CATALOG_READ);
		return itemRepository.findByClinicIdOrderByNameAsc(clinicAccess.requireClinicId()).stream()
				.map(InventoryItemResponse::from)
				.toList();
	}

	@Transactional
	public InventoryItemResponse createItem(InventoryItemRequest request) {
		permissionService.require(Permission.CATALOG_WRITE);
		InventoryItem item = new InventoryItem();
		item.setClinicId(clinicAccess.requireClinicId());
		apply(item, request, true);
		return InventoryItemResponse.from(itemRepository.save(item));
	}

	@Transactional
	public InventoryItemResponse updateItem(Long id, InventoryItemRequest request) {
		permissionService.require(Permission.CATALOG_WRITE);
		InventoryItem item = requireItem(id);
		apply(item, request, false);
		return InventoryItemResponse.from(itemRepository.save(item));
	}

	@Transactional
	public void deleteItem(Long id) {
		permissionService.require(Permission.CATALOG_DELETE);
		itemRepository.delete(requireItem(id));
	}

	@Transactional(readOnly = true)
	public List<InventoryMovementResponse> listMovements(Long itemId) {
		permissionService.require(Permission.CATALOG_READ);
		Long clinicId = clinicAccess.requireClinicId();
		requireItem(itemId);
		return movementRepository.findByClinicIdAndItemIdOrderByCreatedAtDesc(clinicId, itemId).stream()
				.map(InventoryMovementResponse::from)
				.toList();
	}

	@Transactional
	public InventoryMovementResponse move(InventoryMovementRequest request) {
		permissionService.require(Permission.CATALOG_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		InventoryItem item = requireItem(request.itemId());
		String type = request.type().trim().toUpperCase(Locale.ROOT);
		if (!MOVEMENT_TYPES.contains(type)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de movimiento inválido");
		}
		BigDecimal qty = request.quantity().setScale(2, RoundingMode.HALF_UP);
		if (qty.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor a 0");
		}
		BigDecimal current = item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity();
		BigDecimal next = switch (type) {
			case InventoryMovement.IN -> current.add(qty);
			case InventoryMovement.OUT -> current.subtract(qty);
			case InventoryMovement.ADJUST -> qty;
			default -> current;
		};
		if (next.compareTo(BigDecimal.ZERO) < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock insuficiente");
		}
		item.setQuantity(next.setScale(2, RoundingMode.HALF_UP));
		itemRepository.save(item);

		InventoryMovement movement = new InventoryMovement();
		movement.setClinicId(clinicId);
		movement.setItemId(item.getId());
		movement.setType(type);
		movement.setQuantity(qty);
		movement.setNote(request.note());
		return InventoryMovementResponse.from(movementRepository.save(movement));
	}

	private void apply(InventoryItem item, InventoryItemRequest request, boolean creating) {
		item.setSku(request.sku());
		item.setName(request.name().trim());
		item.setUnit(request.unit() == null || request.unit().isBlank() ? "u" : request.unit().trim());
		if (creating && request.quantity() != null) {
			item.setQuantity(request.quantity().setScale(2, RoundingMode.HALF_UP));
		}
		if (request.minQuantity() != null) {
			item.setMinQuantity(request.minQuantity().setScale(2, RoundingMode.HALF_UP));
		}
		if (request.active() != null) {
			item.setActive(request.active());
		}
	}

	private InventoryItem requireItem(Long id) {
		return itemRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ítem no encontrado"));
	}
}
