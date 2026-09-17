package com.dentura.api.ledger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.ledger.dto.LedgerEntryResponse;
import com.dentura.api.ledger.dto.LedgerManualRequest;
import com.dentura.api.ledger.dto.LedgerStatementResponse;
import com.dentura.api.ledger.dto.MorosoResponse;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.payment.Payment;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.work.Work;

@Service
public class LedgerService {

	private static final Set<String> MANUAL_TYPES = Set.of(LedgerEntry.CHARGE, LedgerEntry.ADJUSTMENT);

	private final LedgerEntryRepository ledgerEntryRepository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public LedgerService(
			LedgerEntryRepository ledgerEntryRepository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.ledgerEntryRepository = ledgerEntryRepository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<LedgerEntryResponse> list(Long patientId) {
		permissionService.require(Permission.PAYMENTS_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return ledgerEntryRepository.findByClinicIdAndPatientIdOrderByEntryDateAscIdAsc(clinicId, patientId)
				.stream()
				.map(LedgerEntryResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public LedgerStatementResponse statement(Long patientId) {
		permissionService.require(Permission.PAYMENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		Patient patient = requirePatient(patientId, clinicId);
		List<LedgerEntry> entries = ledgerEntryRepository
				.findByClinicIdAndPatientIdOrderByEntryDateAscIdAsc(clinicId, patientId);
		Totals totals = totals(entries);
		return new LedgerStatementResponse(
				patient.getId(),
				patient.getLastName() + ", " + patient.getFirstName(),
				patient.getRecordNumber(),
				totals.charges,
				totals.payments,
				totals.adjustments,
				totals.balance,
				entries.stream().map(LedgerEntryResponse::from).toList());
	}

	@Transactional(readOnly = true)
	public List<MorosoResponse> morosos() {
		permissionService.require(Permission.PAYMENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		List<Object[]> rows = ledgerEntryRepository.aggregateByPatient(clinicId);
		Map<Long, Patient> patients = patientRepository.findAllById(
				rows.stream().map(row -> (Long) row[0]).toList()).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity(), (a, b) -> a, HashMap::new));

		List<MorosoResponse> result = new ArrayList<>();
		for (Object[] row : rows) {
			Long patientId = (Long) row[0];
			BigDecimal charges = toMoney(row[1]);
			BigDecimal payments = toMoney(row[2]);
			BigDecimal adjustments = toMoney(row[3]);
			BigDecimal balance = charges.add(adjustments).subtract(payments).setScale(2, RoundingMode.HALF_UP);
			if (balance.compareTo(BigDecimal.ZERO) <= 0) {
				continue;
			}
			Patient patient = patients.get(patientId);
			if (patient == null) {
				continue;
			}
			String phone = firstNonBlank(patient.getMobile(), patient.getPhone());
			result.add(new MorosoResponse(
					patientId,
					patient.getLastName() + ", " + patient.getFirstName(),
					patient.getRecordNumber(),
					phone,
					charges,
					payments,
					adjustments,
					balance));
		}
		result.sort(Comparator.comparing(MorosoResponse::balance).reversed());
		return result;
	}

	@Transactional
	public LedgerEntryResponse createManual(LedgerManualRequest request) {
		permissionService.require(Permission.PAYMENTS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		String type = request.type().trim().toUpperCase(Locale.ROOT);
		if (!MANUAL_TYPES.contains(type)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de movimiento inválido");
		}
		if (request.amount() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Monto requerido");
		}
		if (LedgerEntry.CHARGE.equals(type) && request.amount().compareTo(BigDecimal.ZERO) <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cargo debe ser mayor a 0");
		}
		if (LedgerEntry.CHARGE.equals(type) && request.workId() != null
				&& ledgerEntryRepository.existsByWorkIdAndType(request.workId(), LedgerEntry.CHARGE)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya existe un cargo para este trabajo");
		}

		LedgerEntry entry = new LedgerEntry();
		entry.setClinicId(clinicId);
		entry.setPatientId(request.patientId());
		entry.setWorkId(request.workId());
		entry.setType(type);
		entry.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
		entry.setDescription(request.description());
		entry.setEntryDate(request.entryDate() == null ? Instant.now() : request.entryDate());
		return LedgerEntryResponse.from(ledgerEntryRepository.save(entry));
	}

	@Transactional
	public void syncPayment(Payment payment) {
		if (payment == null || payment.getId() == null) {
			return;
		}
		LedgerEntry entry = ledgerEntryRepository.findByPaymentIdAndType(payment.getId(), LedgerEntry.PAYMENT)
				.orElseGet(LedgerEntry::new);
		entry.setClinicId(payment.getClinicId());
		entry.setPatientId(payment.getPatientId());
		entry.setPaymentId(payment.getId());
		entry.setType(LedgerEntry.PAYMENT);
		entry.setAmount(payment.getAmount().setScale(2, RoundingMode.HALF_UP));
		entry.setDescription("Pago recibo #" + payment.getReceiptNumber());
		entry.setEntryDate(payment.getPaidAt() == null ? Instant.now() : payment.getPaidAt());
		ledgerEntryRepository.save(entry);
	}

	@Transactional
	public void removePayment(Long paymentId) {
		ledgerEntryRepository.findByPaymentIdAndType(paymentId, LedgerEntry.PAYMENT)
				.ifPresent(ledgerEntryRepository::delete);
	}

	@Transactional
	public void ensureWorkCharge(Work work, String treatmentLabel) {
		if (work == null || work.getId() == null) {
			return;
		}
		if (Work.REJECTED.equals(work.getStatus())) {
			return;
		}
		if (ledgerEntryRepository.existsByWorkIdAndType(work.getId(), LedgerEntry.CHARGE)) {
			return;
		}
		BigDecimal amount = work.getUnitPrice()
				.multiply(BigDecimal.valueOf(work.getQuantity()))
				.setScale(2, RoundingMode.HALF_UP);
		if (amount.compareTo(BigDecimal.ZERO) <= 0) {
			return;
		}
		LedgerEntry entry = new LedgerEntry();
		entry.setClinicId(work.getClinicId());
		entry.setPatientId(work.getPatientId());
		entry.setWorkId(work.getId());
		entry.setType(LedgerEntry.CHARGE);
		entry.setAmount(amount);
		entry.setDescription(treatmentLabel == null || treatmentLabel.isBlank()
				? "Cargo por trabajo #" + work.getId()
				: treatmentLabel);
		entry.setEntryDate(Instant.now());
		ledgerEntryRepository.save(entry);
	}

	private Totals totals(List<LedgerEntry> entries) {
		BigDecimal charges = BigDecimal.ZERO;
		BigDecimal payments = BigDecimal.ZERO;
		BigDecimal adjustments = BigDecimal.ZERO;
		for (LedgerEntry entry : entries) {
			BigDecimal amount = entry.getAmount() == null ? BigDecimal.ZERO : entry.getAmount();
			if (LedgerEntry.CHARGE.equals(entry.getType())) {
				charges = charges.add(amount);
			} else if (LedgerEntry.PAYMENT.equals(entry.getType())) {
				payments = payments.add(amount);
			} else if (LedgerEntry.ADJUSTMENT.equals(entry.getType())) {
				adjustments = adjustments.add(amount);
			}
		}
		charges = charges.setScale(2, RoundingMode.HALF_UP);
		payments = payments.setScale(2, RoundingMode.HALF_UP);
		adjustments = adjustments.setScale(2, RoundingMode.HALF_UP);
		BigDecimal balance = charges.add(adjustments).subtract(payments).setScale(2, RoundingMode.HALF_UP);
		return new Totals(charges, payments, adjustments, balance);
	}

	private Patient requirePatient(Long patientId, Long clinicId) {
		return patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}

	private static BigDecimal toMoney(Object value) {
		if (value == null) {
			return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		}
		if (value instanceof BigDecimal bd) {
			return bd.setScale(2, RoundingMode.HALF_UP);
		}
		return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
	}

	private static String firstNonBlank(String a, String b) {
		if (a != null && !a.isBlank()) {
			return a;
		}
		if (b != null && !b.isBlank()) {
			return b;
		}
		return null;
	}

	private record Totals(
			BigDecimal charges,
			BigDecimal payments,
			BigDecimal adjustments,
			BigDecimal balance) {
	}
}
