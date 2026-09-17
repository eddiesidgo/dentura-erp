package com.dentura.api.work;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.audit.AuditService;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.ledger.LedgerService;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.payment.PaymentAllocationRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.treatment.TreatmentRepository;
import com.dentura.api.work.dto.WorkRequest;
import com.dentura.api.work.dto.WorkResponse;
import com.dentura.api.work.dto.WorkTreatmentSummaryResponse;

@Service
public class WorkService {

	private static final Set<String> STATUSES = Set.of(Work.PENDING, Work.COMPLETED, Work.REJECTED);
	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");
	private static final int MAX_RESULTS = 1000;

	private final WorkRepository workRepository;
	private final PatientRepository patientRepository;
	private final TreatmentRepository treatmentRepository;
	private final PaymentAllocationRepository paymentAllocationRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final AuditService auditService;
	private final LedgerService ledgerService;

	public WorkService(
			WorkRepository workRepository,
			PatientRepository patientRepository,
			TreatmentRepository treatmentRepository,
			PaymentAllocationRepository paymentAllocationRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			AuditService auditService,
			LedgerService ledgerService) {
		this.workRepository = workRepository;
		this.patientRepository = patientRepository;
		this.treatmentRepository = treatmentRepository;
		this.paymentAllocationRepository = paymentAllocationRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.auditService = auditService;
		this.ledgerService = ledgerService;
	}

	@Transactional(readOnly = true)
	public List<WorkResponse> list(
			Long patientId,
			Long treatmentId,
			String status,
			LocalDate from,
			LocalDate to) {
		permissionService.require(Permission.WORKS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		if (patientId != null) {
			requirePatient(patientId);
		}
		if (treatmentId != null) {
			requireTreatment(treatmentId);
		}
		String normalizedStatus = status == null || status.isBlank() ? null : requireStatus(status.trim().toUpperCase(Locale.ROOT));
		Instant fromInstant = from == null ? null : from.atStartOfDay(ZONE).toInstant();
		Instant toInstant = to == null ? null : to.plusDays(1).atStartOfDay(ZONE).toInstant();
		List<Work> works = workRepository.search(
				clinicId,
				patientId,
				normalizedStatus,
				treatmentId,
				fromInstant,
				toInstant,
				fromInstant == null,
				toInstant == null);
		if (works.size() > MAX_RESULTS) {
			works = works.subList(0, MAX_RESULTS);
		}
		return toResponses(works, clinicId);
	}

	@Transactional(readOnly = true)
	public List<WorkTreatmentSummaryResponse> summaryByTreatment(
			Long patientId,
			String status,
			LocalDate from,
			LocalDate to) {
		List<WorkResponse> works = list(patientId, null, status, from, to);
		Map<Long, Acc> grouped = new LinkedHashMap<>();
		for (WorkResponse work : works) {
			Acc acc = grouped.computeIfAbsent(work.treatmentId(), id -> new Acc(
					work.treatmentId(),
					work.treatmentCode(),
					work.treatmentName()));
			acc.totalWorks++;
			acc.quantityTotal += work.quantity();
			acc.amountTotal = acc.amountTotal.add(work.total());
			if (Work.PENDING.equals(work.status())) {
				acc.pendingCount++;
			} else if (Work.COMPLETED.equals(work.status())) {
				acc.completedCount++;
				acc.completedAmount = acc.completedAmount.add(work.total());
			} else if (Work.REJECTED.equals(work.status())) {
				acc.rejectedCount++;
			}
		}
		List<WorkTreatmentSummaryResponse> rows = new ArrayList<>();
		for (Acc acc : grouped.values()) {
			rows.add(new WorkTreatmentSummaryResponse(
					acc.treatmentId,
					acc.treatmentCode,
					acc.treatmentName,
					acc.totalWorks,
					acc.pendingCount,
					acc.completedCount,
					acc.rejectedCount,
					acc.quantityTotal,
					acc.amountTotal.setScale(2, RoundingMode.HALF_UP),
					acc.completedAmount.setScale(2, RoundingMode.HALF_UP)));
		}
		rows.sort(Comparator
				.comparing(WorkTreatmentSummaryResponse::completedCount)
				.reversed()
				.thenComparing(WorkTreatmentSummaryResponse::treatmentCode));
		return rows;
	}

	@Transactional(readOnly = true)
	public WorkResponse get(Long id) {
		permissionService.require(Permission.WORKS_READ);
		Work work = findOrThrow(id);
		Patient patient = requirePatient(work.getPatientId());
		return WorkResponse.from(work, requireTreatment(work.getTreatmentId()), patient);
	}

	@Transactional
	public WorkResponse create(WorkRequest request) {
		permissionService.require(Permission.WORKS_WRITE);
		Patient patient = requirePatient(request.patientId());
		Treatment treatment = requireTreatment(request.treatmentId());
		Work work = new Work();
		work.setClinicId(clinicAccess.requireClinicId());
		apply(work, request, patient, treatment);
		work = workRepository.save(work);
		ledgerService.ensureWorkCharge(work, treatment.getCode() + " — " + treatment.getName());
		auditService.log("CREATE", "work", work.getId(), treatment.getCode());
		return WorkResponse.from(work, treatment, patient);
	}

	@Transactional
	public WorkResponse update(Long id, WorkRequest request) {
		permissionService.require(Permission.WORKS_WRITE);
		Work work = findOrThrow(id);
		Patient patient = requirePatient(request.patientId());
		Treatment treatment = requireTreatment(request.treatmentId());
		apply(work, request, patient, treatment);
		work = workRepository.save(work);
		ledgerService.ensureWorkCharge(work, treatment.getCode() + " — " + treatment.getName());
		auditService.log("UPDATE", "work", work.getId(), treatment.getCode());
		return WorkResponse.from(work, treatment, patient);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.WORKS_DELETE);
		Work work = findOrThrow(id);
		if (paymentAllocationRepository.existsByWorkId(work.getId())) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"No se puede eliminar: hay pagos asignados a este trabajo");
		}
		auditService.log("DELETE", "work", work.getId(), null);
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
		List<Long> patientIds = works.stream().map(Work::getPatientId).distinct().toList();
		Map<Long, Treatment> treatments = treatmentRepository.findAllById(treatmentIds).stream()
				.filter(treatment -> clinicId.equals(treatment.getClinicId()))
				.collect(Collectors.toMap(Treatment::getId, Function.identity()));
		Map<Long, Patient> patients = patientRepository.findAllById(patientIds).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity()));
		return works.stream()
				.map(work -> {
					Treatment treatment = treatments.get(work.getTreatmentId());
					if (treatment == null) {
						throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tratamiento no encontrado");
					}
					return WorkResponse.from(work, treatment, patients.get(work.getPatientId()));
				})
				.toList();
	}

	private String requireStatus(String status) {
		if (!STATUSES.contains(status)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de trabajo inválido");
		}
		return status;
	}

	private static final class Acc {
		private final Long treatmentId;
		private final String treatmentCode;
		private final String treatmentName;
		private long totalWorks;
		private long pendingCount;
		private long completedCount;
		private long rejectedCount;
		private int quantityTotal;
		private BigDecimal amountTotal = BigDecimal.ZERO;
		private BigDecimal completedAmount = BigDecimal.ZERO;

		private Acc(Long treatmentId, String treatmentCode, String treatmentName) {
			this.treatmentId = treatmentId;
			this.treatmentCode = treatmentCode;
			this.treatmentName = treatmentName;
		}
	}
}
