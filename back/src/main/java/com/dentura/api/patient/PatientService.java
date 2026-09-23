package com.dentura.api.patient;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.ZonedDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.audit.AuditService;
import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicFeatureGuard;
import com.dentura.api.appointment.Appointment;
import com.dentura.api.appointment.AppointmentRepository;
import com.dentura.api.patient.dto.PatientKpisResponse;
import com.dentura.api.patient.dto.PatientPageResponse;
import com.dentura.api.patient.dto.PatientRequest;
import com.dentura.api.patient.dto.PatientResponse;
import com.dentura.api.referral.ReferralSourceRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class PatientService {

	private static final Set<String> SORTABLE = Set.of(
			"lastName", "firstName", "recordNumber", "createdAt", "updatedAt", "city");

	private final PatientRepository patientRepository;
	private final AppointmentRepository appointmentRepository;
	private final ReferralSourceRepository referralSourceRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final AuditService auditService;
	private final ClinicFeatureGuard clinicFeatureGuard;

	public PatientService(
			PatientRepository patientRepository,
			AppointmentRepository appointmentRepository,
			ReferralSourceRepository referralSourceRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			AuditService auditService,
			ClinicFeatureGuard clinicFeatureGuard) {
		this.patientRepository = patientRepository;
		this.appointmentRepository = appointmentRepository;
		this.referralSourceRepository = referralSourceRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.auditService = auditService;
		this.clinicFeatureGuard = clinicFeatureGuard;
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

	@Transactional(readOnly = true)
	public PatientKpisResponse kpis(int upcomingDays, int inactivityDays) {
		permissionService.require(Permission.PATIENTS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		int normalizedUpcomingDays = Math.max(1, Math.min(upcomingDays, 60));
		int normalizedInactivityDays = Math.max(30, Math.min(inactivityDays, 365));

		Instant now = Instant.now();
		Instant monthStart = ZonedDateTime.now()
				.withDayOfMonth(1)
				.truncatedTo(ChronoUnit.DAYS)
				.toInstant();
		Instant upcomingLimit = now.plus(normalizedUpcomingDays, ChronoUnit.DAYS);
		Instant inactivityCutoff = now.minus(normalizedInactivityDays, ChronoUnit.DAYS);

		long totalPatients = patientRepository.countByClinicId(clinicId);
		long newPatientsThisMonth = patientRepository.countCreatedSince(clinicId, monthStart);
		long patientsWithUpcomingAppointment = appointmentRepository
				.countDistinctPatientsByClinicIdAndDateRangeAndStatuses(
						clinicId,
						now,
						upcomingLimit,
						Set.of(Appointment.SCHEDULED, Appointment.CONFIRMED));
		long inactivePatients = patientRepository.countInactivePatients(
				clinicId,
				inactivityCutoff,
				Appointment.CANCELLED);

		return new PatientKpisResponse(
				totalPatients,
				newPatientsThisMonth,
				patientsWithUpcomingAppointment,
				inactivePatients,
				normalizedUpcomingDays,
				normalizedInactivityDays);
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
		auditService.log("CREATE", "patient", patient.getId(), patient.getRecordNumber());
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
		patient = patientRepository.save(patient);
		auditService.log("UPDATE", "patient", patient.getId(), patient.getRecordNumber());
		return PatientResponse.from(patient);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PATIENTS_DELETE);
		Patient patient = findOrThrow(id);
		auditService.log("DELETE", "patient", patient.getId(), patient.getRecordNumber());
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
		Clinic clinic = clinicFeatureGuard.requireClinic();
		if (!clinic.isReferralsInboundEnabled()) {
			patient.setReferredBy(null);
			patient.setReferralSourceId(null);
		} else {
			patient.setReferredBy(request.referredBy());
			patient.setReferralSourceId(resolveReferralSourceId(request.referralSourceId()));
		}
		patient.setAllergies(request.allergies());
		patient.setNotes(request.notes());
		if (request.active() != null) {
			patient.setActive(request.active());
		}
	}

	private Long resolveReferralSourceId(Long referralSourceId) {
		if (referralSourceId == null) {
			return null;
		}
		return referralSourceRepository.findByIdAndClinicId(referralSourceId, clinicAccess.requireClinicId())
				.map(source -> source.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fuente de referidos no válida"));
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
