package com.dentura.api.treatment;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.treatment.dto.TreatmentPageResponse;
import com.dentura.api.treatment.dto.TreatmentRequest;
import com.dentura.api.treatment.dto.TreatmentResponse;
import com.dentura.api.work.WorkRepository;

@Service
public class TreatmentService {

	private static final Set<String> SORTABLE = Set.of("code", "name", "price", "sortOrder");

	private final TreatmentRepository treatmentRepository;
	private final WorkRepository workRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public TreatmentService(
			TreatmentRepository treatmentRepository,
			WorkRepository workRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.treatmentRepository = treatmentRepository;
		this.workRepository = workRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public TreatmentPageResponse list(String query, Boolean active, int page, int size, String sort) {
		permissionService.require(Permission.CATALOG_READ);
		int pageIndex = Math.max(page, 1);
		int pageSize = size < 1 ? 50 : Math.min(size, 200);
		Pageable pageable = PageRequest.of(pageIndex - 1, pageSize, parseSort(sort));
		Page<Treatment> result = treatmentRepository.search(
				clinicAccess.requireClinicId(),
				query == null ? "" : query.trim(),
				active,
				pageable);
		List<TreatmentResponse> data = result.getContent().stream().map(TreatmentResponse::from).toList();
		return new TreatmentPageResponse(data, result.getTotalElements(), pageIndex, pageSize);
	}

	@Transactional(readOnly = true)
	public TreatmentResponse get(Long id) {
		permissionService.require(Permission.CATALOG_READ);
		return TreatmentResponse.from(findOrThrow(id));
	}

	@Transactional
	public TreatmentResponse create(TreatmentRequest request) {
		permissionService.require(Permission.CATALOG_WRITE);
		assertUniqueCode(request.code(), null);
		Treatment treatment = new Treatment();
		treatment.setClinicId(clinicAccess.requireClinicId());
		apply(treatment, request);
		return TreatmentResponse.from(treatmentRepository.save(treatment));
	}

	@Transactional
	public TreatmentResponse update(Long id, TreatmentRequest request) {
		permissionService.require(Permission.CATALOG_WRITE);
		Treatment treatment = findOrThrow(id);
		assertUniqueCode(request.code(), id);
		apply(treatment, request);
		return TreatmentResponse.from(treatmentRepository.save(treatment));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.CATALOG_DELETE);
		Treatment treatment = findOrThrow(id);
		if (workRepository.existsByTreatmentId(treatment.getId())) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"No se puede eliminar: hay trabajos que usan este tratamiento");
		}
		treatmentRepository.delete(treatment);
	}

	Treatment findOrThrow(Long id) {
		return treatmentRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tratamiento no encontrado"));
	}

	private void apply(Treatment treatment, TreatmentRequest request) {
		treatment.setCode(request.code());
		treatment.setName(request.name());
		treatment.setPrice(request.price() == null ? BigDecimal.ZERO : request.price());
		if (request.active() != null) {
			treatment.setActive(request.active());
		}
		if (request.sortOrder() != null) {
			treatment.setSortOrder(request.sortOrder());
		}
	}

	private void assertUniqueCode(String code, Long currentId) {
		Long clinicId = clinicAccess.requireClinicId();
		boolean taken = currentId == null
				? treatmentRepository.existsByClinicIdAndCodeIgnoreCase(clinicId, code)
				: treatmentRepository.existsByClinicIdAndCodeIgnoreCaseAndIdNot(clinicId, code, currentId);
		if (taken) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un tratamiento con ese código");
		}
	}

	private Sort parseSort(String sort) {
		if (sort == null || sort.isBlank()) {
			return Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("code"));
		}
		String[] parts = sort.split(",", 2);
		String property = parts[0].trim();
		if (!SORTABLE.contains(property)) {
			property = "code";
		}
		boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
		return Sort.by(desc ? Sort.Order.desc(property) : Sort.Order.asc(property));
	}
}
