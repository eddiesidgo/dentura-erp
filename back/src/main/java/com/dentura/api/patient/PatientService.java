package com.dentura.api.patient;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.dto.PatientPageResponse;
import com.dentura.api.patient.dto.PatientRequest;
import com.dentura.api.patient.dto.PatientResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class PatientService {

	private static final Set<String> SORTABLE = Set.of(
			"lastName", "firstName", "recordNumber", "createdAt", "updatedAt", "city");

	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PatientService(
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public PatientPageResponse list(String query, Boolean active, int page, int size, String sort) {
		permissionService.require(Permission.PATIENTS_READ);
		int pageIndex = Math.max(page, 1);
		int pageSize = size < 1 ? 10 : Math.min(size, 100);
		Pageable pageable = PageRequest.of(pageIndex - 1, pageSize, parseSort(sort));
		Boolean activeFilter = active == null ? Boolean.TRUE : active;
		Page<Patient> result = patientRepository.search(
				clinicAccess.requireClinicId(),
				query == null ? "" : query.trim(),
				activeFilter,
				pageable);
		List<PatientResponse> data = result.getContent().stream().map(PatientResponse::from).toList();
		return new PatientPageResponse(data, result.getTotalElements(), pageIndex, pageSize);
	}

	@Transactional(readOnly = true)
	public PatientResponse get(Long id) {
		permissionService.require(Permission.PATIENTS_READ);
		return PatientResponse.from(findOrThrow(id));
	}

	@Transactional
	public PatientResponse create(PatientRequest request) {
		permissionService.require(Permission.PATIENTS_WRITE);
		assertUniqueDui(request.dui(), null);
		assertUniqueRecordNumber(request.recordNumber(), null);

		Patient patient = new Patient();
		patient.setClinicId(clinicAccess.requireClinicId());
		apply(patient, request);
		boolean generateNumber = request.recordNumber() == null;
		if (generateNumber) {
			patient.setRecordNumber("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
		}
		patient = patientRepository.saveAndFlush(patient);
		if (generateNumber) {
			patient.setRecordNumber(String.format("P-%06d", patient.getId()));
			patient = patientRepository.save(patient);
		}
		return PatientResponse.from(patient);
	}

	@Transactional
	public PatientResponse update(Long id, PatientRequest request) {
		permissionService.require(Permission.PATIENTS_WRITE);
		Patient patient = findOrThrow(id);
		assertUniqueDui(request.dui(), id);
		assertUniqueRecordNumber(request.recordNumber(), id);
		apply(patient, request);
		if (patient.getRecordNumber() == null) {
			patient.setRecordNumber(String.format("P-%06d", patient.getId()));
		}
		return PatientResponse.from(patientRepository.save(patient));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PATIENTS_DELETE);
		Patient patient = findOrThrow(id);
		patientRepository.delete(patient);
	}

	private Patient findOrThrow(Long id) {
		return patientRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}

	private void apply(Patient patient, PatientRequest request) {
		if (request.recordNumber() != null) {
			patient.setRecordNumber(request.recordNumber());
		}
		patient.setFirstName(request.firstName());
		patient.setLastName(request.lastName());
		patient.setSex(request.sex());
		patient.setDateOfBirth(request.dateOfBirth());
		patient.setPhone(request.phone());
		patient.setMobile(request.mobile());
		patient.setEmail(request.email());
		patient.setAddress(request.address());
		patient.setCity(request.city());
		patient.setDepartment(request.department());
		patient.setDui(request.dui());
		patient.setNit(request.nit());
		patient.setOccupation(request.occupation());
		patient.setReferredBy(request.referredBy());
		patient.setAllergies(request.allergies());
		patient.setNotes(request.notes());
		if (request.active() != null) {
			patient.setActive(request.active());
		}
	}

	private void assertUniqueDui(String dui, Long currentId) {
		if (dui == null) {
			return;
		}
		Long clinicId = clinicAccess.requireClinicId();
		boolean taken = currentId == null
				? patientRepository.existsByClinicIdAndDui(clinicId, dui)
				: patientRepository.existsByClinicIdAndDuiAndIdNot(clinicId, dui, currentId);
		if (taken) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un paciente con ese DUI");
		}
	}

	private void assertUniqueRecordNumber(String recordNumber, Long currentId) {
		if (recordNumber == null) {
			return;
		}
		Long clinicId = clinicAccess.requireClinicId();
		boolean taken = currentId == null
				? patientRepository.existsByClinicIdAndRecordNumber(clinicId, recordNumber)
				: patientRepository.existsByClinicIdAndRecordNumberAndIdNot(clinicId, recordNumber, currentId);
		if (taken) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un paciente con ese expediente");
		}
	}

	private Sort parseSort(String sort) {
		if (sort == null || sort.isBlank()) {
			return Sort.by(Sort.Order.asc("lastName"), Sort.Order.asc("firstName"));
		}
		String[] parts = sort.split(",", 2);
		String property = parts[0].trim();
		if (!SORTABLE.contains(property)) {
			property = "lastName";
		}
		boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
		return Sort.by(desc ? Sort.Order.desc(property) : Sort.Order.asc(property));
	}
}
