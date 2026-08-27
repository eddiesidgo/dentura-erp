package com.dentura.api.work;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.treatment.TreatmentRepository;
import com.dentura.api.work.dto.WorkRequest;
import com.dentura.api.work.dto.WorkResponse;

@Service
public class WorkService {

	private static final Set<String> STATUSES = Set.of(Work.PENDING, Work.COMPLETED, Work.REJECTED);

	private final WorkRepository workRepository;
	private final PatientRepository patientRepository;
	private final TreatmentRepository treatmentRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public WorkService(
			WorkRepository workRepository,
			PatientRepository patientRepository,
			TreatmentRepository treatmentRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.workRepository = workRepository;
		this.patientRepository = patientRepository;
		this.treatmentRepository = treatmentRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<WorkResponse> list(Long patientId) {
		permissionService.require(Permission.WORKS_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId);
		List<Work> works = workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId);
		return toResponses(works, clinicId);
	}

	@Transactional(readOnly = true)
	public WorkResponse get(Long id) {
		permissionService.require(Permission.WORKS_READ);
		Work work = findOrThrow(id);
		return WorkResponse.from(work, requireTreatment(work.getTreatmentId()));
	}

	@Transactional
	public WorkResponse create(WorkRequest request) {
		permissionService.require(Permission.WORKS_WRITE);
		Patient patient = requirePatient(request.patientId());
		Treatment treatment = requireTreatment(request.treatmentId());
		Work work = new Work();
		work.setClinicId(clinicAccess.requireClinicId());
		apply(work, request, patient, treatment);
		return WorkResponse.from(workRepository.save(work), treatment);
	}

	@Transactional
	public WorkResponse update(Long id, WorkRequest request) {
		permissionService.require(Permission.WORKS_WRITE);
		Work work = findOrThrow(id);
		Patient patient = requirePatient(request.patientId());
		Treatment treatment = requireTreatment(request.treatmentId());
		apply(work, request, patient, treatment);
		return WorkResponse.from(workRepository.save(work), treatment);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.WORKS_DELETE);
		Work work = findOrThrow(id);
		workRepository.delete(work);
	}

	private void apply(Work work, WorkRequest request, Patient patient, Treatment treatment) {
		work.setPatientId(patient.getId());
		work.setTreatmentId(treatment.getId());
		work.setStatus(request.status() == null ? Work.PENDING : requireStatus(request.status()));
		int quantity = request.quantity() == null ? 1 : request.quantity();
		if (quantity < 1) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser al menos 1");
		}
		work.setQuantity(quantity);
		work.setUnitPrice(request.unitPrice() == null ? treatment.getPrice() : request.unitPrice());
		work.setTooth(request.tooth());
		work.setNotes(request.notes());
	}

	private Work findOrThrow(Long id) {
		return workRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajo no encontrado"));
	}

	private Patient requirePatient(Long patientId) {
		return patientRepository.findByIdAndClinicId(patientId, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}

	private Treatment requireTreatment(Long treatmentId) {
		return treatmentRepository.findByIdAndClinicId(treatmentId, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tratamiento no encontrado"));
	}

	private List<WorkResponse> toResponses(List<Work> works, Long clinicId) {
		List<Long> treatmentIds = works.stream().map(Work::getTreatmentId).distinct().toList();
		Map<Long, Treatment> treatments = treatmentRepository.findAllById(treatmentIds).stream()
				.filter(treatment -> clinicId.equals(treatment.getClinicId()))
				.collect(Collectors.toMap(Treatment::getId, Function.identity()));
		return works.stream()
				.map(work -> {
					Treatment treatment = treatments.get(work.getTreatmentId());
					if (treatment == null) {
						throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tratamiento no encontrado");
					}
					return WorkResponse.from(work, treatment);
				})
				.toList();
	}

	private String requireStatus(String status) {
		if (!STATUSES.contains(status)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de trabajo inválido");
		}
		return status;
	}
}
