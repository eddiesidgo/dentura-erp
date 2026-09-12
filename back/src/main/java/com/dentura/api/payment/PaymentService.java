package com.dentura.api.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.payment.dto.PatientBalanceResponse;
import com.dentura.api.payment.dto.PaymentRequest;
import com.dentura.api.payment.dto.PaymentResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.work.Work;
import com.dentura.api.work.WorkRepository;

@Service
public class PaymentService {

	private static final Set<String> METHODS = Set.of(
			Payment.CASH, Payment.CARD, Payment.TRANSFER, Payment.OTHER);

	private final PaymentRepository paymentRepository;
	private final PaymentAllocationRepository allocationRepository;
	private final ClinicReceiptSequenceRepository receiptSequenceRepository;
	private final PatientRepository patientRepository;
	private final WorkRepository workRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PaymentService(
			PaymentRepository paymentRepository,
			PaymentAllocationRepository allocationRepository,
			ClinicReceiptSequenceRepository receiptSequenceRepository,
			PatientRepository patientRepository,
			WorkRepository workRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.paymentRepository = paymentRepository;
		this.allocationRepository = allocationRepository;
		this.receiptSequenceRepository = receiptSequenceRepository;
		this.patientRepository = patientRepository;
		this.workRepository = workRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<PaymentResponse> list(Long patientId) {
		permissionService.require(Permission.PAYMENTS_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		List<Payment> payments = paymentRepository.findByClinicIdAndPatientIdOrderByPaidAtDesc(clinicId, patientId);
		return toResponses(payments);
	}

	@Transactional(readOnly = true)
	public PaymentResponse get(Long id) {
		permissionService.require(Permission.PAYMENTS_READ);
		Payment payment = findOrThrow(id);
		return PaymentResponse.from(payment, allocationRepository.findByPaymentIdOrderByIdAsc(payment.getId()));
	}

	@Transactional(readOnly = true)
	public PatientBalanceResponse balance(Long patientId) {
		permissionService.require(Permission.PAYMENTS_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);

		BigDecimal worksTotal = workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId)
				.stream()
				.filter(work -> !Work.REJECTED.equals(work.getStatus()))
				.map(work -> work.getUnitPrice().multiply(BigDecimal.valueOf(work.getQuantity())))
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);

		BigDecimal paidTotal = paymentRepository.findByClinicIdAndPatientId(clinicId, patientId).stream()
				.map(Payment::getAmount)
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);

		BigDecimal balance = worksTotal.subtract(paidTotal).setScale(2, RoundingMode.HALF_UP);
		return new PatientBalanceResponse(patientId, worksTotal, paidTotal, balance);
	}

	@Transactional
	public PaymentResponse create(PaymentRequest request) {
		permissionService.require(Permission.PAYMENTS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		validateAllocations(request, clinicId);

		Payment payment = new Payment();
		payment.setClinicId(clinicId);
		payment.setPatientId(request.patientId());
		payment.setReceiptNumber(nextReceiptNumber(clinicId));
		payment.setCreatedBy(clinicAccess.currentUser().getUser().getId());
		apply(payment, request);
		payment = paymentRepository.save(payment);
		List<PaymentAllocation> allocations = saveAllocations(payment.getId(), request.allocations());
		return PaymentResponse.from(payment, allocations);
	}

	@Transactional
	public PaymentResponse update(Long id, PaymentRequest request) {
		permissionService.require(Permission.PAYMENTS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		Payment payment = findOrThrow(id);
		requirePatient(request.patientId(), clinicId);
		validateAllocations(request, clinicId);
		apply(payment, request);
		payment = paymentRepository.save(payment);
		allocationRepository.deleteByPaymentId(payment.getId());
		List<PaymentAllocation> allocations = saveAllocations(payment.getId(), request.allocations());
		return PaymentResponse.from(payment, allocations);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PAYMENTS_DELETE);
		Payment payment = findOrThrow(id);
		allocationRepository.deleteByPaymentId(payment.getId());
		paymentRepository.delete(payment);
	}

	private void apply(Payment payment, PaymentRequest request) {
		payment.setPatientId(request.patientId());
		payment.setPaidAt(request.paidAt() == null ? Instant.now() : request.paidAt());
		payment.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
		payment.setMethod(requireMethod(request.method()));
		payment.setNotes(request.notes());
	}

	private void validateAllocations(PaymentRequest request, Long clinicId) {
		BigDecimal allocationSum = BigDecimal.ZERO;
		for (PaymentRequest.AllocationRequest item : request.allocations()) {
			if (item.amount() == null || item.amount().compareTo(BigDecimal.ZERO) <= 0) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto de la asignación debe ser mayor a 0");
			}
			allocationSum = allocationSum.add(item.amount());
			if (item.workId() != null) {
				Work work = workRepository.findByIdAndClinicId(item.workId(), clinicId)
						.filter(w -> request.patientId().equals(w.getPatientId()))
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trabajo no válido"));
				if (!clinicId.equals(work.getClinicId())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trabajo no válido");
				}
			}
		}
		if (allocationSum.compareTo(request.amount()) > 0) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"La suma de asignaciones no puede superar el monto del pago");
		}
	}

	private List<PaymentAllocation> saveAllocations(Long paymentId, List<PaymentRequest.AllocationRequest> requests) {
		List<PaymentAllocation> saved = new ArrayList<>();
		for (PaymentRequest.AllocationRequest item : requests) {
			PaymentAllocation allocation = new PaymentAllocation();
			allocation.setPaymentId(paymentId);
			allocation.setWorkId(item.workId());
			allocation.setAmount(item.amount().setScale(2, RoundingMode.HALF_UP));
			saved.add(allocationRepository.save(allocation));
		}
		return saved;
	}

	private int nextReceiptNumber(Long clinicId) {
		ClinicReceiptSequence sequence = receiptSequenceRepository.findByClinicIdForUpdate(clinicId)
				.orElseGet(() -> {
					ClinicReceiptSequence created = new ClinicReceiptSequence();
					created.setClinicId(clinicId);
					created.setNextNumber(1);
					return receiptSequenceRepository.saveAndFlush(created);
				});
		int number = sequence.getNextNumber();
		sequence.setNextNumber(number + 1);
		receiptSequenceRepository.save(sequence);
		return number;
	}

	private String requireMethod(String method) {
		String value = method.toUpperCase(Locale.ROOT);
		if (!METHODS.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Método de pago inválido");
		}
		return value;
	}

	private List<PaymentResponse> toResponses(List<Payment> payments) {
		if (payments.isEmpty()) {
			return List.of();
		}
		List<Long> ids = payments.stream().map(Payment::getId).toList();
		Map<Long, List<PaymentAllocation>> byPayment = allocationRepository.findByPaymentIdIn(ids).stream()
				.collect(Collectors.groupingBy(PaymentAllocation::getPaymentId));
		return payments.stream()
				.map(payment -> PaymentResponse.from(
						payment,
						byPayment.getOrDefault(payment.getId(), List.of())))
				.toList();
	}

	private Payment findOrThrow(Long id) {
		return paymentRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
