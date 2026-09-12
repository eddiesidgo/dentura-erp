package com.dentura.api.prescription;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.prescription.dto.PrescriptionRequest;
import com.dentura.api.prescription.dto.PrescriptionResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class PrescriptionService {

	private final PrescriptionRepository prescriptionRepository;
	private final PrescriptionTemplateRepository templateRepository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PrescriptionService(
			PrescriptionRepository prescriptionRepository,
			PrescriptionTemplateRepository templateRepository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.prescriptionRepository = prescriptionRepository;
		this.templateRepository = templateRepository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<PrescriptionResponse> list(Long patientId) {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return prescriptionRepository.findByClinicIdAndPatientIdOrderByPrescribedAtDesc(clinicId, patientId).stream()
				.map(PrescriptionResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public PrescriptionResponse get(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		return PrescriptionResponse.from(findOrThrow(id));
	}

	@Transactional
	public PrescriptionResponse create(PrescriptionRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		Prescription prescription = new Prescription();
		prescription.setClinicId(clinicId);
		apply(prescription, request, clinicId);
		return PrescriptionResponse.from(prescriptionRepository.save(prescription));
	}

	@Transactional
	public PrescriptionResponse update(Long id, PrescriptionRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		Prescription prescription = findOrThrow(id);
		requirePatient(request.patientId(), clinicId);
		apply(prescription, request, clinicId);
		return PrescriptionResponse.from(prescriptionRepository.save(prescription));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_DELETE);
		prescriptionRepository.delete(findOrThrow(id));
	}

	private void apply(Prescription prescription, PrescriptionRequest request, Long clinicId) {
		prescription.setPatientId(request.patientId());
		prescription.setDrug(request.drug());
		prescription.setDose(request.dose());
		prescription.setFrequency(request.frequency());
		prescription.setDuration(request.duration());
		prescription.setInstructions(request.instructions());
		prescription.setPrescribedAt(request.prescribedAt() == null ? Instant.now() : request.prescribedAt());
		prescription.setTemplateId(resolveTemplateId(request.templateId(), clinicId));
		prescription.setNotes(request.notes());
	}

	private Long resolveTemplateId(Long templateId, Long clinicId) {
		if (templateId == null) {
			return null;
		}
		return templateRepository.findByIdAndClinicId(templateId, clinicId)
				.map(PrescriptionTemplate::getId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plantilla no válida"));
	}

	private Prescription findOrThrow(Long id) {
		return prescriptionRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receta no encontrada"));
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
