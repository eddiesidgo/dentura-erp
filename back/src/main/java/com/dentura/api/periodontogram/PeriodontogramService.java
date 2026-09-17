package com.dentura.api.periodontogram;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.periodontogram.dto.PeriodontogramEntryRequest;
import com.dentura.api.periodontogram.dto.PeriodontogramEntryResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class PeriodontogramService {

	private final PeriodontogramEntryRepository repository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PeriodontogramService(
			PeriodontogramEntryRepository repository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.repository = repository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<PeriodontogramEntryResponse> list(Long patientId) {
		permissionService.require(Permission.ODONTOGRAM_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return repository.findByClinicIdAndPatientIdOrderByToothAscRecordedAtDesc(clinicId, patientId).stream()
				.map(PeriodontogramEntryResponse::from)
				.toList();
	}

	@Transactional
	public PeriodontogramEntryResponse create(PeriodontogramEntryRequest request) {
		permissionService.require(Permission.ODONTOGRAM_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		PeriodontogramEntry entry = new PeriodontogramEntry();
		entry.setClinicId(clinicId);
		apply(entry, request);
		return PeriodontogramEntryResponse.from(repository.save(entry));
	}

	@Transactional
	public PeriodontogramEntryResponse update(Long id, PeriodontogramEntryRequest request) {
		permissionService.require(Permission.ODONTOGRAM_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		PeriodontogramEntry entry = repository.findByIdAndClinicId(id, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado"));
		requirePatient(request.patientId(), clinicId);
		apply(entry, request);
		return PeriodontogramEntryResponse.from(repository.save(entry));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.ODONTOGRAM_DELETE);
		Long clinicId = clinicAccess.requireClinicId();
		PeriodontogramEntry entry = repository.findByIdAndClinicId(id, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado"));
		repository.delete(entry);
	}

	private void apply(PeriodontogramEntry entry, PeriodontogramEntryRequest request) {
		entry.setPatientId(request.patientId());
		entry.setTooth(request.tooth().trim());
		entry.setValuesJson(request.valuesJson());
		entry.setNotes(request.notes());
		entry.setRecordedAt(request.recordedAt() == null ? Instant.now() : request.recordedAt());
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
