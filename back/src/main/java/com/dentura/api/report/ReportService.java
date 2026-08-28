package com.dentura.api.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicLogoStorage;
import com.dentura.api.clinic.ClinicService;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.report.dto.ClinicLetterhead;
import com.dentura.api.report.dto.StatusSummaryRow;
import com.dentura.api.report.dto.WorkReportRow;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.treatment.TreatmentRepository;
import com.dentura.api.work.Work;
import com.dentura.api.work.WorkRepository;

@Service
public class ReportService {

	private final WorkRepository workRepository;
	private final PatientRepository patientRepository;
	private final TreatmentRepository treatmentRepository;
	private final ClinicAccess clinicAccess;
	private final ClinicService clinicService;
	private final ClinicLogoStorage clinicLogoStorage;
	private final PermissionService permissionService;

	public ReportService(
			WorkRepository workRepository,
			PatientRepository patientRepository,
			TreatmentRepository treatmentRepository,
			ClinicAccess clinicAccess,
			ClinicService clinicService,
			ClinicLogoStorage clinicLogoStorage,
			PermissionService permissionService) {
		this.workRepository = workRepository;
		this.patientRepository = patientRepository;
		this.treatmentRepository = treatmentRepository;
		this.clinicAccess = clinicAccess;
		this.clinicService = clinicService;
		this.clinicLogoStorage = clinicLogoStorage;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<WorkReportRow> worksList(
			Long patientId,
			String status,
			Long treatmentId,
			Instant from,
			Instant to) {
		permissionService.require(Permission.REPORTS_READ);
		return mapRows(search(patientId, status, treatmentId, from, to));
	}

	@Transactional(readOnly = true)
	public List<StatusSummaryRow> worksSummary(Instant from, Instant to) {
		permissionService.require(Permission.REPORTS_READ);
		List<Work> works = search(null, null, null, from, to);
		Map<String, SummaryAccumulator> grouped = new LinkedHashMap<>();
		grouped.put(Work.PENDING, new SummaryAccumulator(Work.PENDING));
		grouped.put(Work.COMPLETED, new SummaryAccumulator(Work.COMPLETED));
		grouped.put(Work.REJECTED, new SummaryAccumulator(Work.REJECTED));
		for (Work work : works) {
			SummaryAccumulator acc = grouped.computeIfAbsent(work.getStatus(), SummaryAccumulator::new);
			acc.count++;
			acc.total = acc.total.add(lineTotal(work));
		}
		return grouped.values().stream()
				.map(acc -> StatusSummaryRow.of(
						acc.status,
						ReportFormat.statusLabel(acc.status),
						acc.count,
						acc.total))
				.toList();
	}

	@Transactional(readOnly = true)
	public PatientQuotation quotation(Long patientId) {
		permissionService.require(Permission.REPORTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		Patient patient = patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
						org.springframework.http.HttpStatus.NOT_FOUND, "Paciente no encontrado"));
		List<Work> works = workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId);
		List<WorkReportRow> rows = mapRows(works);
		BigDecimal pending = sumWorks(works, Work.PENDING);
		BigDecimal completed = sumWorks(works, Work.COMPLETED);
		BigDecimal rejected = sumWorks(works, Work.REJECTED);
		return new PatientQuotation(
				patient.getRecordNumber(),
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getDui(),
				patient.getMobile() != null ? patient.getMobile() : patient.getPhone(),
				rows,
				ReportFormat.money(pending),
				ReportFormat.money(completed),
				ReportFormat.money(rejected),
				ReportFormat.money(pending.add(completed)));
	}

	@Transactional(readOnly = true)
	public ClinicLetterhead letterhead() {
		Clinic clinic = clinicService.requireById(clinicAccess.requireClinicId());
		String cityLine = joinNonBlank(clinic.getCity(), clinic.getDepartment());
		return new ClinicLetterhead(
				clinic.getName(),
				clinic.getNit(),
				clinic.getAddress(),
				cityLine,
				clinic.getPhone(),
				clinic.getEmail(),
				resolveLogoDataUri(clinic));
	}

	private List<Work> search(Long patientId, String status, Long treatmentId, Instant from, Instant to) {
		return workRepository.search(
				clinicAccess.requireClinicId(),
				patientId,
				status,
				treatmentId,
				from != null ? from : Instant.EPOCH,
				to != null ? to : Instant.parse("9999-12-31T23:59:59.999Z"),
				from == null,
				to == null);
	}

	private List<WorkReportRow> mapRows(List<Work> works) {
		if (works.isEmpty()) {
			return List.of();
		}
		Long clinicId = clinicAccess.requireClinicId();
		Map<Long, Patient> patients = patientRepository
				.findAllById(works.stream().map(Work::getPatientId).distinct().toList())
				.stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity()));
		Map<Long, Treatment> treatments = treatmentRepository
				.findAllById(works.stream().map(Work::getTreatmentId).distinct().toList())
				.stream()
				.filter(treatment -> clinicId.equals(treatment.getClinicId()))
				.collect(Collectors.toMap(Treatment::getId, Function.identity()));
		return works.stream()
				.map(work -> {
					Patient patient = patients.get(work.getPatientId());
					Treatment treatment = treatments.get(work.getTreatmentId());
					String patientName = patient == null
							? "—"
							: patient.getLastName() + ", " + patient.getFirstName();
					String recordNumber = patient == null ? "—" : patient.getRecordNumber();
					String code = treatment == null ? "—" : treatment.getCode();
					String name = treatment == null ? "—" : treatment.getName();
					return WorkReportRow.of(
							patientName,
							recordNumber,
							code,
							name,
							work.getStatus(),
							ReportFormat.statusLabel(work.getStatus()),
							work.getQuantity(),
							work.getUnitPrice(),
							lineTotal(work),
							work.getTooth(),
							ReportFormat.date(work.getCreatedAt()));
				})
				.toList();
	}

	private BigDecimal lineTotal(Work work) {
		return work.getUnitPrice().multiply(BigDecimal.valueOf(work.getQuantity()));
	}

	private BigDecimal sumWorks(List<Work> works, String status) {
		return works.stream()
				.filter(work -> status.equals(work.getStatus()))
				.map(this::lineTotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private String resolveLogoDataUri(Clinic clinic) {
		return clinicLogoStorage.load(clinic.getId())
				.map(logo -> "data:" + logo.contentType() + ";base64,"
						+ Base64.getEncoder().encodeToString(logo.bytes()))
				.orElse(null);
	}

	private String joinNonBlank(String... parts) {
		String joined = java.util.Arrays.stream(parts)
				.filter(part -> part != null && !part.isBlank())
				.collect(Collectors.joining(", "));
		return joined.isBlank() ? null : joined;
	}

	private static final class SummaryAccumulator {
		private final String status;
		private long count;
		private BigDecimal total = BigDecimal.ZERO;

		private SummaryAccumulator(String status) {
			this.status = status;
		}
	}

	public record PatientQuotation(
			String recordNumber,
			String patientName,
			String dui,
			String phone,
			List<WorkReportRow> rows,
			String pendingTotal,
			String completedTotal,
			String rejectedTotal,
			String quoteTotal) {
	}
}
