package com.dentura.api.demo;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.appointment.Appointment;
import com.dentura.api.appointment.AppointmentRepository;
import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.medication.Medication;
import com.dentura.api.medication.MedicationRepository;
import com.dentura.api.medication.MedicationSeeder;
import com.dentura.api.odontogram.OdontogramEntry;
import com.dentura.api.odontogram.OdontogramEntryRepository;
import com.dentura.api.patient.Patient;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.payment.ClinicReceiptSequence;
import com.dentura.api.payment.ClinicReceiptSequenceRepository;
import com.dentura.api.payment.Payment;
import com.dentura.api.payment.PaymentAllocation;
import com.dentura.api.payment.PaymentAllocationRepository;
import com.dentura.api.payment.PaymentRepository;
import com.dentura.api.prescription.Prescription;
import com.dentura.api.prescription.PrescriptionRepository;
import com.dentura.api.prescription.PrescriptionTemplate;
import com.dentura.api.prescription.PrescriptionTemplateRepository;
import com.dentura.api.referral.OutboundReferral;
import com.dentura.api.referral.OutboundReferralRepository;
import com.dentura.api.referral.ReferralSource;
import com.dentura.api.referral.ReferralSourceRepository;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.treatment.TreatmentRepository;
import com.dentura.api.work.Work;
import com.dentura.api.work.WorkRepository;

@Service
public class DemoDataSeeder {

	public static final String DEMO_PREFIX = "DEMO-";
	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");

	private final boolean enabled;
	private final ClinicAccess clinicAccess;
	private final PatientRepository patientRepository;
	private final TreatmentRepository treatmentRepository;
	private final WorkRepository workRepository;
	private final AppointmentRepository appointmentRepository;
	private final OdontogramEntryRepository odontogramEntryRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentAllocationRepository paymentAllocationRepository;
	private final ClinicReceiptSequenceRepository receiptSequenceRepository;
	private final PrescriptionTemplateRepository prescriptionTemplateRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final ReferralSourceRepository referralSourceRepository;
	private final OutboundReferralRepository outboundReferralRepository;
	private final MedicationRepository medicationRepository;
	private final MedicationSeeder medicationSeeder;

	public DemoDataSeeder(
			@Value("${dentura.demo.seed-enabled:false}") boolean enabled,
			ClinicAccess clinicAccess,
			PatientRepository patientRepository,
			TreatmentRepository treatmentRepository,
			WorkRepository workRepository,
			AppointmentRepository appointmentRepository,
			OdontogramEntryRepository odontogramEntryRepository,
			PaymentRepository paymentRepository,
			PaymentAllocationRepository paymentAllocationRepository,
			ClinicReceiptSequenceRepository receiptSequenceRepository,
			PrescriptionTemplateRepository prescriptionTemplateRepository,
			PrescriptionRepository prescriptionRepository,
			ReferralSourceRepository referralSourceRepository,
			OutboundReferralRepository outboundReferralRepository,
			MedicationRepository medicationRepository,
			MedicationSeeder medicationSeeder) {
		this.enabled = enabled;
		this.clinicAccess = clinicAccess;
		this.patientRepository = patientRepository;
		this.treatmentRepository = treatmentRepository;
		this.workRepository = workRepository;
		this.appointmentRepository = appointmentRepository;
		this.odontogramEntryRepository = odontogramEntryRepository;
		this.paymentRepository = paymentRepository;
		this.paymentAllocationRepository = paymentAllocationRepository;
		this.receiptSequenceRepository = receiptSequenceRepository;
		this.prescriptionTemplateRepository = prescriptionTemplateRepository;
		this.prescriptionRepository = prescriptionRepository;
		this.referralSourceRepository = referralSourceRepository;
		this.outboundReferralRepository = outboundReferralRepository;
		this.medicationRepository = medicationRepository;
		this.medicationSeeder = medicationSeeder;
	}

	public boolean isEnabled() {
		return enabled;
	}

	@Transactional
	public DemoSeedResult seed() {
		if (!enabled) {
			throw new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"Demo seed deshabilitado. Arranca con DENTURA_DEMO_SEED_ENABLED=true");
		}
		clinicAccess.requireSuperAdmin();
		Long clinicId = clinicAccess.requireClinicId();
		medicationSeeder.ensureClinicCatalog(clinicId);

		if (patientRepository.existsByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "001")) {
			return DemoSeedResult.alreadyPresent(clinicId);
		}

		ReferralSource sourceDoctor = saveSource(clinicId, "Dr. Carlos Mendoza", "PERSON", "2250-1001");
		ReferralSource sourceClinic = saveSource(clinicId, "Clínica Sonrisa SV", "CLINIC", "2250-2002");

		Patient ana = savePatient(
				clinicId,
				DEMO_PREFIX + "001",
				"Ana",
				"López",
				"FEMALE",
				LocalDate.of(1992, 3, 14),
				"7890-1234",
				"ana.lopez.demo@dentura.local",
				"DUI-DEMO-001",
				sourceDoctor.getId(),
				"Dr. Carlos Mendoza");
		Patient luis = savePatient(
				clinicId,
				DEMO_PREFIX + "002",
				"Luis",
				"Ramírez",
				"MALE",
				LocalDate.of(1985, 11, 2),
				"7788-5566",
				"luis.ramirez.demo@dentura.local",
				"DUI-DEMO-002",
				sourceClinic.getId(),
				"Clínica Sonrisa SV");
		Patient maria = savePatient(
				clinicId,
				DEMO_PREFIX + "003",
				"María",
				"Hernández",
				"FEMALE",
				LocalDate.of(2001, 7, 22),
				"7001-3344",
				"maria.hernandez.demo@dentura.local",
				"DUI-DEMO-003",
				null,
				null);

		Treatment consult = requireTreatment(clinicId, "CONS");
		Treatment prophylaxis = requireTreatment(clinicId, "PROF");
		Treatment resin = requireTreatment(clinicId, "RR");
		Treatment extraction = requireTreatment(clinicId, "EXO");

		setPriceIfZero(consult, "25.00");
		setPriceIfZero(prophylaxis, "45.00");
		setPriceIfZero(resin, "60.00");
		setPriceIfZero(extraction, "80.00");

		Work anaConsult = saveWork(clinicId, ana.getId(), consult, Work.COMPLETED, 1, consult.getPrice(), "11", null);
		Work anaResin = saveWork(clinicId, ana.getId(), resin, Work.PENDING, 1, resin.getPrice(), "16", "MOD");
		saveWork(clinicId, luis.getId(), prophylaxis, Work.PENDING, 1, prophylaxis.getPrice(), null, null);
		saveWork(clinicId, luis.getId(), extraction, Work.REJECTED, 1, extraction.getPrice(), "48", null);
		saveWork(clinicId, maria.getId(), consult, Work.PENDING, 1, consult.getPrice(), null, "Primera visita");

		ZonedDateTime now = ZonedDateTime.now(ZONE);
		saveAppointment(clinicId, ana.getId(), now.plusDays(1).withHour(9).withMinute(0), 45, Appointment.CONFIRMED, "Control");
		saveAppointment(clinicId, luis.getId(), now.plusDays(2).withHour(10).withMinute(30), 60, Appointment.SCHEDULED, "Profilaxis");
		saveAppointment(clinicId, maria.getId(), now.plusDays(3).withHour(15).withMinute(0), 30, Appointment.SCHEDULED, "Consulta");

		saveOdontogram(clinicId, ana.getId(), "16", "MOD", OdontogramEntry.CARIES, OdontogramEntry.PLANNED, anaResin.getId());
		saveOdontogram(clinicId, ana.getId(), "11", null, OdontogramEntry.FILLING, OdontogramEntry.COMPLETED, anaConsult.getId());
		saveOdontogram(clinicId, luis.getId(), "48", null, OdontogramEntry.EXTRACTION_PLANNED, OdontogramEntry.EXISTING, null);
		saveOdontogram(clinicId, maria.getId(), "26", "O", OdontogramEntry.CARIES, OdontogramEntry.EXISTING, null);

		Payment anaPayment = savePayment(clinicId, ana.getId(), anaConsult.getUnitPrice(), Payment.CASH, "Abono consulta demo");
		PaymentAllocation alloc = new PaymentAllocation();
		alloc.setPaymentId(anaPayment.getId());
		alloc.setWorkId(anaConsult.getId());
		alloc.setAmount(anaConsult.getUnitPrice());
		paymentAllocationRepository.save(alloc);

		PrescriptionTemplate amox = saveTemplate(clinicId, "Amoxicilina 500 mg", "1 cápsula", "cada 8 horas", "7 días", "Tomar con alimentos");
		Medication amoxMed = medicationRepository.findByClinicIdAndCodeIgnoreCase(clinicId, "AMOX500").orElse(null);
		Medication ibuMed = medicationRepository.findByClinicIdAndCodeIgnoreCase(clinicId, "IBU400").orElse(null);
		savePrescription(clinicId, ana.getId(), amox, amoxMed, "Tras restauración");
		savePrescription(
				clinicId,
				luis.getId(),
				null,
				ibuMed,
				ibuMed != null ? ibuMed.getName() : "Ibuprofeno 400 mg",
				ibuMed != null ? ibuMed.getDose() : "1 tableta",
				ibuMed != null ? ibuMed.getFrequency() : "cada 8 horas",
				ibuMed != null ? ibuMed.getDuration() : "3 días",
				ibuMed != null ? ibuMed.getInstructions() : "Si hay dolor",
				"Pre-exodoncia");

		saveOutbound(clinicId, luis.getId(), "Endodoncia", "Dr. Pérez Endodoncia", "Evaluar 48", OutboundReferral.SENT);
		saveOutbound(clinicId, maria.getId(), "Ortodoncia", "Centro Ortodoncia SV", "Apiñamiento leve", OutboundReferral.DRAFT);

		Map<String, Object> counts = new LinkedHashMap<>();
		counts.put("patients", 3);
		counts.put("appointments", 3);
		counts.put("works", 5);
		counts.put("odontogramEntries", 4);
		counts.put("payments", 1);
		counts.put("prescriptions", 2);
		counts.put("referralSources", 2);
		counts.put("outboundReferrals", 2);
		counts.put("recordNumbers", List.of(DEMO_PREFIX + "001", DEMO_PREFIX + "002", DEMO_PREFIX + "003"));
		return DemoSeedResult.created(clinicId, counts);
	}

	private ReferralSource saveSource(Long clinicId, String name, String type, String phone) {
		ReferralSource source = new ReferralSource();
		source.setClinicId(clinicId);
		source.setName(name);
		source.setType(type);
		source.setPhone(phone);
		source.setActive(true);
		return referralSourceRepository.save(source);
	}

	private Patient savePatient(
			Long clinicId,
			String recordNumber,
			String firstName,
			String lastName,
			String sex,
			LocalDate dob,
			String mobile,
			String email,
			String dui,
			Long referralSourceId,
			String referredBy) {
		Patient patient = new Patient();
		patient.setClinicId(clinicId);
		patient.setRecordNumber(recordNumber);
		patient.setFirstName(firstName);
		patient.setLastName(lastName);
		patient.setSex(sex);
		patient.setDateOfBirth(dob);
		patient.setMobile(mobile);
		patient.setEmail(email);
		patient.setDui(dui);
		patient.setCity("San Salvador");
		patient.setDepartment("San Salvador");
		patient.setReferralSourceId(referralSourceId);
		patient.setReferredBy(referredBy);
		patient.setNotes("Paciente de demostración (DEMO). Seguro eliminar en producción.");
		patient.setActive(true);
		return patientRepository.save(patient);
	}

	private Treatment requireTreatment(Long clinicId, String code) {
		return treatmentRepository.findByClinicIdAndCodeIgnoreCase(clinicId, code)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Falta tratamiento " + code + " en el catálogo. Reinicia el API para seedear tratamientos."));
	}

	private void setPriceIfZero(Treatment treatment, String price) {
		if (treatment.getPrice() == null || treatment.getPrice().compareTo(BigDecimal.ZERO) == 0) {
			treatment.setPrice(new BigDecimal(price));
			treatmentRepository.save(treatment);
		}
	}

	private Work saveWork(
			Long clinicId,
			Long patientId,
			Treatment treatment,
			String status,
			int quantity,
			BigDecimal unitPrice,
			String tooth,
			String notes) {
		Work work = new Work();
		work.setClinicId(clinicId);
		work.setPatientId(patientId);
		work.setTreatmentId(treatment.getId());
		work.setStatus(status);
		work.setQuantity(quantity);
		work.setUnitPrice(unitPrice);
		work.setTooth(tooth);
		work.setNotes(notes);
		return workRepository.save(work);
	}

	private void saveAppointment(
			Long clinicId,
			Long patientId,
			ZonedDateTime start,
			int minutes,
			String status,
			String reason) {
		Appointment appointment = new Appointment();
		appointment.setClinicId(clinicId);
		appointment.setPatientId(patientId);
		appointment.setStartAt(start.toInstant());
		appointment.setEndAt(start.plusMinutes(minutes).toInstant());
		appointment.setStatus(status);
		appointment.setReason(reason);
		appointmentRepository.save(appointment);
	}

	private void saveOdontogram(
			Long clinicId,
			Long patientId,
			String tooth,
			String surfaces,
			String condition,
			String status,
			Long workId) {
		OdontogramEntry entry = new OdontogramEntry();
		entry.setClinicId(clinicId);
		entry.setPatientId(patientId);
		entry.setTooth(tooth);
		entry.setSurfaces(surfaces);
		entry.setCondition(condition);
		entry.setStatus(status);
		entry.setWorkId(workId);
		odontogramEntryRepository.save(entry);
	}

	private Payment savePayment(Long clinicId, Long patientId, BigDecimal amount, String method, String notes) {
		Payment payment = new Payment();
		payment.setClinicId(clinicId);
		payment.setPatientId(patientId);
		payment.setReceiptNumber(nextReceiptNumber(clinicId));
		payment.setPaidAt(Instant.now().minusSeconds(3600));
		payment.setAmount(amount);
		payment.setMethod(method);
		payment.setNotes(notes);
		payment.setCreatedBy(clinicAccess.currentUser().getUser().getId());
		return paymentRepository.save(payment);
	}

	private int nextReceiptNumber(Long clinicId) {
		ClinicReceiptSequence sequence = receiptSequenceRepository.findByClinicIdForUpdate(clinicId)
				.orElseGet(() -> {
					ClinicReceiptSequence created = new ClinicReceiptSequence();
					created.setClinicId(clinicId);
					created.setNextNumber(1);
					return created;
				});
		int number = sequence.getNextNumber();
		sequence.setNextNumber(number + 1);
		receiptSequenceRepository.save(sequence);
		return number;
	}

	private PrescriptionTemplate saveTemplate(
			Long clinicId,
			String drug,
			String dose,
			String frequency,
			String duration,
			String instructions) {
		PrescriptionTemplate template = new PrescriptionTemplate();
		template.setClinicId(clinicId);
		template.setDrug(drug);
		template.setDose(dose);
		template.setFrequency(frequency);
		template.setDuration(duration);
		template.setInstructions(instructions);
		template.setActive(true);
		return prescriptionTemplateRepository.save(template);
	}

	private void savePrescription(
			Long clinicId,
			Long patientId,
			PrescriptionTemplate template,
			Medication medication,
			String notes) {
		savePrescription(
				clinicId,
				patientId,
				template,
				medication,
				template.getDrug(),
				template.getDose(),
				template.getFrequency(),
				template.getDuration(),
				template.getInstructions(),
				notes);
	}

	private void savePrescription(
			Long clinicId,
			Long patientId,
			PrescriptionTemplate template,
			Medication medication,
			String drug,
			String dose,
			String frequency,
			String duration,
			String instructions,
			String notes) {
		Prescription prescription = new Prescription();
		prescription.setClinicId(clinicId);
		prescription.setPatientId(patientId);
		prescription.setTemplateId(template == null ? null : template.getId());
		prescription.setMedicationId(medication == null ? null : medication.getId());
		prescription.setDrug(drug);
		prescription.setDose(dose);
		prescription.setFrequency(frequency);
		prescription.setDuration(duration);
		prescription.setInstructions(instructions);
		prescription.setPrescribedAt(Instant.now().minusSeconds(7200));
		prescription.setNotes(notes);
		prescriptionRepository.save(prescription);
	}

	private void saveOutbound(
			Long clinicId,
			Long patientId,
			String specialty,
			String toName,
			String reason,
			String status) {
		OutboundReferral referral = new OutboundReferral();
		referral.setClinicId(clinicId);
		referral.setPatientId(patientId);
		referral.setSpecialty(specialty);
		referral.setToName(toName);
		referral.setReason(reason);
		referral.setStatus(status);
		referral.setReferredAt(Instant.now());
		outboundReferralRepository.save(referral);
	}

	public record DemoSeedResult(String status, Long clinicId, Map<String, Object> details) {
		static DemoSeedResult created(Long clinicId, Map<String, Object> details) {
			return new DemoSeedResult("CREATED", clinicId, details);
		}

		static DemoSeedResult alreadyPresent(Long clinicId) {
			return new DemoSeedResult(
					"ALREADY_PRESENT",
					clinicId,
					Map.of(
							"message",
							"Ya existen pacientes DEMO-00x en esta clínica. No se duplicó data.",
							"hint",
							"Abre Pacientes y busca DEMO-001"));
		}
	}
}
