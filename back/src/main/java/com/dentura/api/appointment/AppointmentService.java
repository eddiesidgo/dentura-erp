package com.dentura.api.appointment;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.appointment.dto.AppointmentRequest;
import com.dentura.api.appointment.dto.AppointmentResponse;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class AppointmentService {

	private static final Set<String> STATUSES = Set.of(
			Appointment.SCHEDULED,
			Appointment.CONFIRMED,
			Appointment.CANCELLED,
			Appointment.COMPLETED,
			Appointment.NO_SHOW);

	private final AppointmentRepository appointmentRepository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public AppointmentService(
			AppointmentRepository appointmentRepository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.appointmentRepository = appointmentRepository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<AppointmentResponse> list(Instant from, Instant to) {
		permissionService.require(Permission.AGENDA_READ);
		if (from == null || to == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el rango de fechas");
		}
		if (!to.isAfter(from)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha final debe ser posterior al inicio");
		}
		Long clinicId = clinicAccess.requireClinicId();
		List<Appointment> appointments = appointmentRepository
				.findByClinicIdAndStartAtGreaterThanEqualAndStartAtLessThanOrderByStartAtAsc(clinicId, from, to);
		return toResponses(appointments, clinicId);
	}

	@Transactional(readOnly = true)
	public AppointmentResponse get(Long id) {
		permissionService.require(Permission.AGENDA_READ);
		Appointment appointment = findOrThrow(id);
		return AppointmentResponse.from(appointment, requirePatient(appointment.getPatientId()));
	}

	@Transactional
	public AppointmentResponse create(AppointmentRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		validateRange(request.startAt(), request.endAt());
		Patient patient = requirePatient(request.patientId());
		Appointment appointment = new Appointment();
		appointment.setClinicId(clinicAccess.requireClinicId());
		apply(appointment, request, patient);
		return AppointmentResponse.from(appointmentRepository.save(appointment), patient);
	}

	@Transactional
	public AppointmentResponse update(Long id, AppointmentRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		validateRange(request.startAt(), request.endAt());
		Appointment appointment = findOrThrow(id);
		Patient patient = requirePatient(request.patientId());
		apply(appointment, request, patient);
		return AppointmentResponse.from(appointmentRepository.save(appointment), patient);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.AGENDA_DELETE);
		Appointment appointment = findOrThrow(id);
		appointmentRepository.delete(appointment);
	}

	private void apply(Appointment appointment, AppointmentRequest request, Patient patient) {
		appointment.setPatientId(patient.getId());
		appointment.setStartAt(request.startAt());
		appointment.setEndAt(request.endAt());
		appointment.setStatus(request.status() == null ? Appointment.SCHEDULED : requireStatus(request.status()));
		appointment.setReason(request.reason());
		appointment.setNotes(request.notes());
	}

	private Appointment findOrThrow(Long id) {
		return appointmentRepository.findById(id)
				.filter(appointment -> clinicAccess.requireClinicId().equals(appointment.getClinicId()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
	}

	private Patient requirePatient(Long patientId) {
		return patientRepository.findByIdAndClinicId(patientId, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}

	private List<AppointmentResponse> toResponses(List<Appointment> appointments, Long clinicId) {
		List<Long> patientIds = appointments.stream().map(Appointment::getPatientId).distinct().toList();
		Map<Long, Patient> patients = patientRepository.findAllById(patientIds).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity()));
		return appointments.stream()
				.map(appointment -> {
					Patient patient = patients.get(appointment.getPatientId());
					if (patient == null) {
						throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado");
					}
					return AppointmentResponse.from(appointment, patient);
				})
				.toList();
	}

	private void validateRange(Instant startAt, Instant endAt) {
		if (!endAt.isAfter(startAt)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La hora de fin debe ser posterior al inicio");
		}
	}

	private String requireStatus(String status) {
		if (!STATUSES.contains(status)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de cita inválido");
		}
		return status;
	}
}
