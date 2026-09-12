package com.dentura.api.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicLogoStorage;
import com.dentura.api.clinic.ClinicService;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.payment.Payment;
import com.dentura.api.payment.PaymentAllocation;
import com.dentura.api.payment.PaymentAllocationRepository;
import com.dentura.api.payment.PaymentRepository;
import com.dentura.api.prescription.Prescription;
import com.dentura.api.prescription.PrescriptionRepository;
import com.dentura.api.referral.ReferralSource;
import com.dentura.api.referral.ReferralSourceRepository;
import com.dentura.api.report.dto.ClinicLetterhead;
import com.dentura.api.report.dto.GenericReportRow;
import com.dentura.api.report.dto.PaymentReceiptResponse;
import com.dentura.api.report.dto.PrescriptionReportResponse;
import com.dentura.api.report.dto.ReportClinicView;
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
	private final PaymentRepository paymentRepository;
	private final PaymentAllocationRepository paymentAllocationRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final ReferralSourceRepository referralSourceRepository;
	private final ClinicAccess clinicAccess;
	private final ClinicService clinicService;
	private final ClinicLogoStorage clinicLogoStorage;
	private final PermissionService permissionService;

	public ReportService(
			WorkRepository workRepository,
			PatientRepository patientRepository,
			TreatmentRepository treatmentRepository,
			PaymentRepository paymentRepository,
			PaymentAllocationRepository paymentAllocationRepository,
			PrescriptionRepository prescriptionRepository,
			ReferralSourceRepository referralSourceRepository,
			ClinicAccess clinicAccess,
			ClinicService clinicService,
			ClinicLogoStorage clinicLogoStorage,
			PermissionService permissionService) {
		this.workRepository = workRepository;
		this.patientRepository = patientRepository;
		this.treatmentRepository = treatmentRepository;
		this.paymentRepository = paymentRepository;
		this.paymentAllocationRepository = paymentAllocationRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.referralSourceRepository = referralSourceRepository;
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
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
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
	public PaymentReceiptResponse paymentReceipt(Long paymentId) {
		permissionService.require(Permission.REPORTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		Payment payment = paymentRepository.findByIdAndClinicId(paymentId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));
		Patient patient = patientRepository.findByIdAndClinicId(payment.getPatientId(), clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
		List<PaymentAllocation> allocations = paymentAllocationRepository
				.findByPaymentIdOrderByIdAsc(payment.getId());
		Map<Long, Work> works = loadWorksForAllocations(clinicId, allocations);
		Map<Long, Treatment> treatments = loadTreatmentsForWorks(clinicId, works);

		List<PaymentReceiptResponse.AllocationLine> lines = allocations.stream()
				.map(allocation -> {
					String description = "Abono general";
					if (allocation.getWorkId() != null) {
						Work work = works.get(allocation.getWorkId());
						if (work != null) {
							Treatment treatment = treatments.get(work.getTreatmentId());
							String treatmentName = treatment != null ? treatment.getName() : "Tratamiento";
							String tooth = work.getTooth() != null && !work.getTooth().isBlank()
									? " · Pieza " + work.getTooth()
									: "";
							description = treatmentName + tooth;
						} else {
							description = "Trabajo #" + allocation.getWorkId();
						}
					}
					return new PaymentReceiptResponse.AllocationLine(
							description,
							ReportFormat.money(allocation.getAmount()));
				})
				.toList();

		return new PaymentReceiptResponse(
				payment.getReceiptNumber(),
				ReportFormat.dateTime(payment.getPaidAt()),
				ReportFormat.money(payment.getAmount()),
				payment.getMethod(),
				ReportFormat.paymentMethodLabel(payment.getMethod()),
				payment.getNotes(),
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getRecordNumber(),
				patient.getDui(),
				patient.getMobile() != null ? patient.getMobile() : patient.getPhone(),
				lines);
	}

	@Transactional(readOnly = true)
	public PrescriptionReportResponse prescriptionReport(Long prescriptionId) {
		permissionService.require(Permission.REPORTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		Prescription prescription = prescriptionRepository.findByIdAndClinicId(prescriptionId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receta no encontrada"));
		Patient patient = patientRepository.findByIdAndClinicId(prescription.getPatientId(), clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
		return new PrescriptionReportResponse(
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getRecordNumber(),
				patient.getDui(),
				patient.getMobile() != null ? patient.getMobile() : patient.getPhone(),
				prescription.getDrug(),
				prescription.getDose(),
				prescription.getFrequency(),
				prescription.getDuration(),
				prescription.getInstructions(),
				prescription.getNotes(),
				ReportFormat.date(prescription.getPrescribedAt()));
	}

	@Transactional(readOnly = true)
	public List<StatusSummaryRow> paymentsSummary(Instant from, Instant to) {
		permissionService.require(Permission.REPORTS_READ);
		List<Payment> payments = paymentRepository.searchByPaidAt(
				clinicAccess.requireClinicId(),
				from != null ? from : Instant.EPOCH,
				to != null ? to : Instant.parse("9999-12-31T23:59:59.999Z"),
				from == null,
				to == null);
		Map<String, SummaryAccumulator> grouped = new LinkedHashMap<>();
		grouped.put(Payment.CASH, new SummaryAccumulator(Payment.CASH));
		grouped.put(Payment.CARD, new SummaryAccumulator(Payment.CARD));
		grouped.put(Payment.TRANSFER, new SummaryAccumulator(Payment.TRANSFER));
		grouped.put(Payment.OTHER, new SummaryAccumulator(Payment.OTHER));
		for (Payment payment : payments) {
			SummaryAccumulator acc = grouped.computeIfAbsent(payment.getMethod(), SummaryAccumulator::new);
			acc.count++;
			acc.total = acc.total.add(payment.getAmount());
		}
		return grouped.values().stream()
				.map(acc -> StatusSummaryRow.of(
						acc.status,
						ReportFormat.paymentMethodLabel(acc.status),
						acc.count,
						acc.total))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<GenericReportRow> referralsBySource() {
		permissionService.require(Permission.REPORTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		Map<Long, String> sourceNames = referralSourceRepository.findByClinicIdOrderByNameAsc(clinicId).stream()
				.collect(Collectors.toMap(ReferralSource::getId, ReferralSource::getName, (a, b) -> a, LinkedHashMap::new));

		Map<Long, Long> counts = new LinkedHashMap<>();
		long withoutSource = 0;
		for (Object[] row : patientRepository.countGroupedByReferralSource(clinicId)) {
			Long sourceId = (Long) row[0];
			long count = ((Number) row[1]).longValue();
			if (sourceId == null) {
				withoutSource = count;
			} else {
				counts.put(sourceId, count);
			}
		}

		List<GenericReportRow> rows = new ArrayList<>();
		for (Map.Entry<Long, String> entry : sourceNames.entrySet()) {
			long count = counts.getOrDefault(entry.getKey(), 0L);
			rows.add(GenericReportRow.count(entry.getValue(), count));
		}
		for (Map.Entry<Long, Long> entry : counts.entrySet()) {
			if (!sourceNames.containsKey(entry.getKey())) {
				rows.add(GenericReportRow.count("Fuente #" + entry.getKey(), entry.getValue()));
			}
		}
		rows.add(GenericReportRow.count("Sin fuente", withoutSource));
		return rows;
	}

	@Transactional(readOnly = true)
	public ClinicLetterhead letterhead() {
		return toLetterhead(requireClinic());
	}

	@Transactional(readOnly = true)
	public ReportClinicView clinicView() {
		return toClinicView(requireClinic());
	}

	private Clinic requireClinic() {
		return clinicService.requireById(clinicAccess.requireClinicId());
	}

	private ClinicLetterhead toLetterhead(Clinic clinic) {
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

	private ReportClinicView toClinicView(Clinic clinic) {
		String cityLine = joinNonBlank(clinic.getCity(), clinic.getDepartment());
		String logoUrl = clinic.getLogoUrl();
		if (logoUrl == null || logoUrl.isBlank()) {
			logoUrl = "/api/clinics/" + clinic.getId() + "/logo";
		}
		return new ReportClinicView(
				clinic.getId(),
				clinic.getName(),
				clinic.getNit(),
				clinic.getAddress(),
				cityLine,
				clinic.getPhone(),
				clinic.getEmail(),
				logoUrl,
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

	private Map<Long, Work> loadWorksForAllocations(Long clinicId, List<PaymentAllocation> allocations) {
		List<Long> workIds = allocations.stream()
				.map(PaymentAllocation::getWorkId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		if (workIds.isEmpty()) {
			return Map.of();
		}
		return workRepository.findAllById(workIds).stream()
				.filter(work -> clinicId.equals(work.getClinicId()))
				.collect(Collectors.toMap(Work::getId, Function.identity()));
	}

	private Map<Long, Treatment> loadTreatmentsForWorks(Long clinicId, Map<Long, Work> works) {
		List<Long> treatmentIds = works.values().stream()
				.map(Work::getTreatmentId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		if (treatmentIds.isEmpty()) {
			return Map.of();
		}
		return treatmentRepository.findAllById(treatmentIds).stream()
				.filter(treatment -> clinicId.equals(treatment.getClinicId()))
				.collect(Collectors.toMap(Treatment::getId, Function.identity()));
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
