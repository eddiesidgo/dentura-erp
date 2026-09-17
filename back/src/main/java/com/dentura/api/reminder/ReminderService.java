package com.dentura.api.reminder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
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

import com.dentura.api.appointment.Appointment;
import com.dentura.api.appointment.AppointmentRepository;
import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicRepository;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.reminder.dto.GenerateRemindersResponse;
import com.dentura.api.reminder.dto.ReminderResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class ReminderService {

	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");
	private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZONE);
	private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm").withZone(ZONE);
	private static final Set<String> REMINDABLE = Set.of(Appointment.SCHEDULED, Appointment.CONFIRMED);

	private final ReminderQueueRepository reminderQueueRepository;
	private final AppointmentRepository appointmentRepository;
	private final PatientRepository patientRepository;
	private final ClinicRepository clinicRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public ReminderService(
			ReminderQueueRepository reminderQueueRepository,
			AppointmentRepository appointmentRepository,
			PatientRepository patientRepository,
			ClinicRepository clinicRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.reminderQueueRepository = reminderQueueRepository;
		this.appointmentRepository = appointmentRepository;
		this.patientRepository = patientRepository;
		this.clinicRepository = clinicRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<ReminderResponse> list(String status) {
		permissionService.require(Permission.AGENDA_READ);
		Long clinicId = clinicAccess.requireClinicId();
		List<ReminderQueueItem> items = status == null || status.isBlank()
				? reminderQueueRepository.findByClinicIdOrderByScheduledForAsc(clinicId)
				: reminderQueueRepository.findByClinicIdAndStatusOrderByScheduledForAsc(clinicId, status.trim().toUpperCase());
		return toResponses(items);
	}

	@Transactional
	public GenerateRemindersResponse generateForCurrentClinic() {
		permissionService.require(Permission.AGENDA_WRITE);
		Clinic clinic = clinicRepository.findById(clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));
		return generateForClinic(clinic);
	}

	@Transactional
	public GenerateRemindersResponse generateForAllClinics() {
		int created = 0;
		int skipped = 0;
		for (Clinic clinic : clinicRepository.findAllByActiveTrueOrderByNameAsc()) {
			GenerateRemindersResponse result = generateForClinic(clinic);
			created += result.created();
			skipped += result.skipped();
		}
		return new GenerateRemindersResponse(created, skipped);
	}

	@Transactional
	public ReminderResponse markSent(Long id) {
		permissionService.require(Permission.AGENDA_WRITE);
		ReminderQueueItem item = requireInClinic(id);
		item.setStatus(ReminderQueueItem.SENT);
		item.setSentAt(Instant.now());
		reminderQueueRepository.save(item);
		return toResponses(List.of(item)).get(0);
	}

	@Transactional
	public ReminderResponse markSkipped(Long id) {
		permissionService.require(Permission.AGENDA_WRITE);
		ReminderQueueItem item = requireInClinic(id);
		item.setStatus(ReminderQueueItem.SKIPPED);
		reminderQueueRepository.save(item);
		return toResponses(List.of(item)).get(0);
	}

	private GenerateRemindersResponse generateForClinic(Clinic clinic) {
		int hoursBefore = Math.max(1, clinic.getReminderHoursBefore());
		Instant now = Instant.now();
		Instant windowEnd = now.plus(hoursBefore + 24, ChronoUnit.HOURS);
		List<Appointment> appointments = appointmentRepository.findForReminders(
				clinic.getId(), now, windowEnd, REMINDABLE);

		int created = 0;
		int skipped = 0;
		Map<Long, Patient> patients = loadPatients(appointments, clinic.getId());
		String template = clinic.getReminderMessageTemplate() == null || clinic.getReminderMessageTemplate().isBlank()
				? "Hola {patientName}, le recordamos su cita el {date} a las {time} en {clinicName}. Confirme su asistencia."
				: clinic.getReminderMessageTemplate();
		String countryCode = clinic.getReminderDefaultCountryCode() == null || clinic.getReminderDefaultCountryCode().isBlank()
				? "503"
				: clinic.getReminderDefaultCountryCode().replaceAll("\\D", "");

		for (Appointment appointment : appointments) {
			if (reminderQueueRepository.existsByAppointmentId(appointment.getId())) {
				skipped++;
				continue;
			}
			Patient patient = patients.get(appointment.getPatientId());
			if (patient == null) {
				skipped++;
				continue;
			}
			String phone = normalizePhone(firstNonBlank(patient.getMobile(), patient.getPhone()), countryCode);
			if (phone == null) {
				skipped++;
				continue;
			}
			Instant scheduledFor = appointment.getStartAt().minus(hoursBefore, ChronoUnit.HOURS);
			if (scheduledFor.isBefore(now.minus(1, ChronoUnit.HOURS))) {
				scheduledFor = now;
			}
			String patientName = patient.getFirstName() + " " + patient.getLastName();
			String message = template
					.replace("{patientName}", patientName.trim())
					.replace("{date}", DATE_FMT.format(appointment.getStartAt()))
					.replace("{time}", TIME_FMT.format(appointment.getStartAt()))
					.replace("{clinicName}", clinic.getName());
			String waMeUrl = "https://wa.me/" + phone + "?text="
					+ URLEncoder.encode(message, StandardCharsets.UTF_8);

			ReminderQueueItem item = new ReminderQueueItem();
			item.setClinicId(clinic.getId());
			item.setAppointmentId(appointment.getId());
			item.setPatientId(patient.getId());
			item.setPhoneNormalized(phone);
			item.setMessageBody(message);
			item.setWaMeUrl(waMeUrl);
			item.setStatus(ReminderQueueItem.PENDING);
			item.setScheduledFor(scheduledFor);
			reminderQueueRepository.save(item);
			created++;
		}
		return new GenerateRemindersResponse(created, skipped);
	}

	static String normalizePhone(String raw, String defaultCountryCode) {
		if (raw == null || raw.isBlank()) {
			return null;
		}
		String digits = raw.replaceAll("\\D", "");
		if (digits.isEmpty()) {
			return null;
		}
		if (digits.startsWith("00")) {
			digits = digits.substring(2);
		}
		if (digits.length() <= 8 && defaultCountryCode != null && !defaultCountryCode.isBlank()) {
			digits = defaultCountryCode + digits;
		}
		if (digits.length() < 8) {
			return null;
		}
		return digits;
	}

	private ReminderQueueItem requireInClinic(Long id) {
		return reminderQueueRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recordatorio no encontrado"));
	}

	private Map<Long, Patient> loadPatients(List<Appointment> appointments, Long clinicId) {
		List<Long> ids = appointments.stream().map(Appointment::getPatientId).distinct().toList();
		if (ids.isEmpty()) {
			return Map.of();
		}
		return patientRepository.findAllById(ids).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity(), (a, b) -> a, HashMap::new));
	}

	private List<ReminderResponse> toResponses(List<ReminderQueueItem> items) {
		if (items.isEmpty()) {
			return List.of();
		}
		Long clinicId = items.get(0).getClinicId();
		Map<Long, Patient> patients = patientRepository.findAllById(
				items.stream().map(ReminderQueueItem::getPatientId).distinct().toList()).stream()
				.filter(patient -> clinicId.equals(patient.getClinicId()))
				.collect(Collectors.toMap(Patient::getId, Function.identity()));
		Map<Long, Appointment> appointments = appointmentRepository.findAllById(
				items.stream().map(ReminderQueueItem::getAppointmentId).distinct().toList()).stream()
				.collect(Collectors.toMap(Appointment::getId, Function.identity()));

		return items.stream().map(item -> {
			Patient patient = patients.get(item.getPatientId());
			Appointment appointment = appointments.get(item.getAppointmentId());
			String name = patient == null
					? "Paciente"
					: patient.getLastName() + ", " + patient.getFirstName();
			Instant startAt = appointment == null ? null : appointment.getStartAt();
			return ReminderResponse.from(item, name, startAt);
		}).toList();
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
}
