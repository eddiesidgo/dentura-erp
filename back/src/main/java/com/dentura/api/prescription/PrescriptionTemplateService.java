package com.dentura.api.prescription;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.prescription.dto.PrescriptionTemplateRequest;
import com.dentura.api.prescription.dto.PrescriptionTemplateResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class PrescriptionTemplateService {

	private final PrescriptionTemplateRepository templateRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PrescriptionTemplateService(
			PrescriptionTemplateRepository templateRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.templateRepository = templateRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<PrescriptionTemplateResponse> list() {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		return templateRepository.findByClinicIdOrderByDrugAsc(clinicAccess.requireClinicId()).stream()
				.map(PrescriptionTemplateResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public PrescriptionTemplateResponse get(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_READ);
		return PrescriptionTemplateResponse.from(findOrThrow(id));
	}

	@Transactional
	public PrescriptionTemplateResponse create(PrescriptionTemplateRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		PrescriptionTemplate template = new PrescriptionTemplate();
		template.setClinicId(clinicAccess.requireClinicId());
		apply(template, request);
		return PrescriptionTemplateResponse.from(templateRepository.save(template));
	}

	@Transactional
	public PrescriptionTemplateResponse update(Long id, PrescriptionTemplateRequest request) {
		permissionService.require(Permission.PRESCRIPTIONS_WRITE);
		PrescriptionTemplate template = findOrThrow(id);
		apply(template, request);
		return PrescriptionTemplateResponse.from(templateRepository.save(template));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PRESCRIPTIONS_DELETE);
		templateRepository.delete(findOrThrow(id));
	}

	PrescriptionTemplate findOrThrow(Long id) {
		return templateRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plantilla no encontrada"));
	}

	private void apply(PrescriptionTemplate template, PrescriptionTemplateRequest request) {
		template.setDrug(request.drug());
		template.setDose(request.dose());
		template.setFrequency(request.frequency());
		template.setDuration(request.duration());
		template.setInstructions(request.instructions());
		if (request.active() != null) {
			template.setActive(request.active());
		}
	}
}
