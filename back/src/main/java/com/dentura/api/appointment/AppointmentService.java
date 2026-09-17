package com.dentura.api.appointment;

import java.time.Instant;
import java.util.HashMap;
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
import com.dentura.api.audit.AuditService;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.provider.Provider;
import com.dentura.api.provider.ProviderRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.room.Room;
import com.dentura.api.room.RoomRepository;

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
	private final ProviderRepository providerRepository;
	private final RoomRepository roomRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final AuditService auditService;

	public AppointmentService(
			AppointmentRepository appointmentRepository,
			PatientRepository patientRepository,
			ProviderRepository providerRepository,
			RoomRepository roomRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			AuditService auditService) {
		this.appointmentRepository = appointmentRepository;
		this.patientRepository = patientRepository;
		this.providerRepository = providerRepository;
		this.roomRepository = roomRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.auditService = auditService;
	}

	@Transactional(readOnly = true)
	public List<AppointmentResponse> list(Instant from, Instant to, Long providerId, Long roomId) {
		permissionService.require(Permission.AGENDA_READ);
		if (from == null || to == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el rango de fechas");
		}
		if (!to.isAfter(from)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha final debe ser posterior al inicio");
		}
		Long clinicId = clinicAccess.requireClinicId();
		List<Appointment> appointments = appointmentRepository.search(
				clinicId, from, to, providerId, roomId);
		return toResponses(appointments, clinicId);
	}

	@Transactional(readOnly = true)
	public AppointmentResponse get(Long id) {
		permissionService.require(Permission.AGENDA_READ);
		Appointment appointment = findOrThrow(id);
		return toResponse(appointment);
	}

	@Transactional
	public AppointmentResponse create(AppointmentRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		validateRange(request.startAt(), request.endAt());
		Patient patient = requirePatient(request.patientId());
		Provider provider = resolveProvider(request.providerId());
		Room room = resolveRoom(request.roomId());
		assertNoOverlap(null, provider.getId(), room == null ? null : room.getId(), request.startAt(), request.endAt());
		Appointment appointment = new Appointment();
		appointment.setClinicId(clinicAccess.requireClinicId());
		apply(appointment, request, patient, provider, room);
		appointment = appointmentRepository.save(appointment);
		auditService.log("CREATE", "appointment", appointment.getId(), patient.getRecordNumber());
		return AppointmentResponse.from(appointment, patient, provider, room);
	}

	@Transactional
	public AppointmentResponse update(Long id, AppointmentRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		validateRange(request.startAt(), request.endAt());
		Appointment appointment = findOrThrow(id);
		Patient patient = requirePatient(request.patientId());
		Provider provider = resolveProvider(request.providerId());
		Room room = resolveRoom(request.roomId());
		assertNoOverlap(id, provider.getId(), room == null ? null : room.getId(), request.startAt(), request.endAt());
		apply(appointment, request, patient, provider, room);
		appointment = appointmentRepository.save(appointment);
		auditService.log("UPDATE", "appointment", appointment.getId(), patient.getRecordNumber());
		return AppointmentResponse.from(appointment, patient, provider, room);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.AGENDA_DELETE);
		Appointment appointment = findOrThrow(id);
		auditService.log("DELETE", "appointment", appointment.getId(), null);
		appointmentRepository.delete(appointment);
	}

	private void apply(
			Appointment appointment,
			AppointmentRequest request,
			Patient patient,
			Provider provider,
			Room room) {
		appointment.setPatientId(patient.getId());
		appointment.setProviderId(provider.getId());
		appointment.setRoomId(room == null ? null : room.getId());
		appointment.setStartAt(request.startAt());
		appointment.setEndAt(request.endAt());
		appointment.setStatus(request.status() == null ? Appointment.SCHEDULED : requireStatus(request.status()));
		appointment.setReason(request.reason());
		appointment.setNotes(request.notes());
	}

	private void assertNoOverlap(
			Long excludeId,
			Long providerId,
			Long roomId,
			Instant startAt,
			Instant endAt) {
		Long clinicId = clinicAccess.requireClinicId();
		List<Appointment> providerConflicts = appointmentRepository.findOverlappingForProvider(
				clinicId, providerId, startAt, endAt, Appointment.CANCELLED, excludeId);
		if (!providerConflicts.isEmpty()) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"El profesional ya tiene una cita en ese horario");
		}
		if (roomId != null) {
			List<Appointment> roomConflicts = appointmentRepository.findOverlappingForRoom(
					clinicId, roomId, startAt, endAt, Appointment.CANCELLED, excludeId);
			if (!roomConflicts.isEmpty()) {
				throw new ResponseStatusException(
						HttpStatus.CONFLICT,
						"La sala ya está ocupada en ese horario");
			}
		}
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

	private Provider requireProvider(Long providerId) {
		return providerRepository.findByIdAndClinicId(providerId, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profesional no encontrado"));
	}

	private Provider resolveProvider(Long providerId) {
		if (providerId != null) {
			return requireProvider(providerId);
		}
		Long clinicId = clinicAccess.requireClinicId();
		return providerRepository.findFirstByClinicIdAndName(clinicId, "General")
				.orElseGet(() -> {
					Provider provider = new Provider();
					provider.setClinicId(clinicId);
					provider.setName("General");
					provider.setColor("#3B82F6");
					provider.setActive(true);
					return providerRepository.save(provider);
				});
	}

	private Room resolveRoom(Long roomId) {
		if (roomId == null) {
			return null;
		}
		return roomRepository.findByIdAndClinicId(roomId, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sala no encontrada"));
	}

	private AppointmentResponse toResponse(Appointment appointment) {
		Patient patient = requirePatient(appointment.getPatientId());
		Provider provider = requireProvider(appointment.getProviderId());
		Room room = resolveRoom(appointment.getRoomId());
		return AppointmentResponse.from(appointment, patient, provider, room);
	}

	private List<AppointmentResponse> toResponses(List<Appointment> appointments, Long clinicId) {
		List<Long> patientIds = appointments.stream().map(Appointment::getPatientId).distinct().toList();
		List<Long> providerIds = appointments.stream().map(Appointment::getProviderId).distinct().toList();
		List<Long> roomIds = appointments.stream()
				.map(Appointment::getRoomId)
				.filter(id -> id != null)
				.distinct()
				.toList();

		Map<Long, Patient> patients = patientRepository.findAllById(patientIds).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity()));
		Map<Long, Provider> providers = providerRepository.findAllById(providerIds).stream()
				.filter(provider -> clinicId.equals(provider.getClinicId()))
				.collect(Collectors.toMap(Provider::getId, Function.identity()));
		Map<Long, Room> rooms = roomIds.isEmpty()
				? Map.of()
				: roomRepository.findAllById(roomIds).stream()
						.filter(room -> clinicId.equals(room.getClinicId()))
						.collect(Collectors.toMap(Room::getId, Function.identity(), (a, b) -> a, HashMap::new));

		return appointments.stream()
				.map(appointment -> {
					Patient patient = patients.get(appointment.getPatientId());
					Provider provider = providers.get(appointment.getProviderId());
					if (patient == null || provider == null) {
						throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Datos de cita incompletos");
					}
					Room room = appointment.getRoomId() == null ? null : rooms.get(appointment.getRoomId());
					return AppointmentResponse.from(appointment, patient, provider, room);
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
