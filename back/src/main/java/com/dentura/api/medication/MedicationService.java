package com.dentura.api.medication;

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
import com.dentura.api.medication.dto.MedicationPageResponse;
import com.dentura.api.medication.dto.MedicationRequest;
import com.dentura.api.medication.dto.MedicationResponse;
import com.dentura.api.prescription.PrescriptionRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class MedicationService {

	private static final Set<String> SORTABLE = Set.of("code", "name", "form", "sortOrder");

	private final MedicationRepository medicationRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public MedicationService(
			MedicationRepository medicationRepository,
			PrescriptionRepository prescriptionRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.medicationRepository = medicationRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public MedicationPageResponse list(String query, Boolean active, int page, int size, String sort) {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		int pageIndex = Math.max(page, 1);
		int pageSize = size < 1 ? 50 : Math.min(size, 200);
		Pageable pageable = PageRequest.of(pageIndex - 1, pageSize, parseSort(sort));
		Page<Medication> result = medicationRepository.search(
				clinicAccess.requireClinicId(),
				query == null ? "" : query.trim(),
				active,
				pageable);
		List<MedicationResponse> data = result.getContent().stream().map(MedicationResponse::from).toList();
		return new MedicationPageResponse(data, result.getTotalElements(), pageIndex, pageSize);
	}

	@Transactional(readOnly = true)
	public MedicationResponse get(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		return MedicationResponse.from(findOrThrow(id));
	}

	@Transactional
	public MedicationResponse create(MedicationRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		assertUniqueCode(request.code(), null);
		Medication medication = new Medication();
		medication.setClinicId(clinicAccess.requireClinicId());
		apply(medication, request);
		return MedicationResponse.from(medicationRepository.save(medication));
	}

	@Transactional
	public MedicationResponse update(Long id, MedicationRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		Medication medication = findOrThrow(id);
		assertUniqueCode(request.code(), id);
		apply(medication, request);
		return MedicationResponse.from(medicationRepository.save(medication));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_DELETE);
		Medication medication = findOrThrow(id);
		if (prescriptionRepository.existsByMedicationId(medication.getId())) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"No se puede eliminar: hay recetas que usan este medicamento");
		}
		medicationRepository.delete(medication);
	}

	Medication findOrThrow(Long id) {
		return medicationRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicamento no encontrado"));
	}

	private void apply(Medication medication, MedicationRequest request) {
		medication.setCode(request.code());
		medication.setName(request.name());
		medication.setForm(request.form());
		medication.setDose(request.dose());
		medication.setFrequency(request.frequency());
		medication.setDuration(request.duration());
		medication.setInstructions(request.instructions());
		if (request.active() != null) {
			medication.setActive(request.active());
		}
		if (request.sortOrder() != null) {
			medication.setSortOrder(request.sortOrder());
		}
	}

	private void assertUniqueCode(String code, Long currentId) {
		Long clinicId = clinicAccess.requireClinicId();
		boolean taken = currentId == null
				? medicationRepository.existsByClinicIdAndCodeIgnoreCase(clinicId, code)
				: medicationRepository.existsByClinicIdAndCodeIgnoreCaseAndIdNot(clinicId, code, currentId);
		if (taken) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un medicamento con ese código");
		}
	}

	private Sort parseSort(String sort) {
		if (sort == null || sort.isBlank()) {
			return Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name"));
		}
		String[] parts = sort.split(",", 2);
		String field = parts[0].trim();
		if (!SORTABLE.contains(field)) {
			field = "name";
		}
		boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
		return desc ? Sort.by(Sort.Order.desc(field)) : Sort.by(Sort.Order.asc(field));
	}
}
