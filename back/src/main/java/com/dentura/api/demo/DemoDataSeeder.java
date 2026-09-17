package com.dentura.api.demo;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
import com.dentura.api.consent.ConsentTemplate;
import com.dentura.api.consent.ConsentTemplateRepository;
import com.dentura.api.consent.PatientConsent;
import com.dentura.api.consent.PatientConsentRepository;
import com.dentura.api.inventory.InventoryItem;
import com.dentura.api.inventory.InventoryItemRepository;
import com.dentura.api.inventory.InventoryMovement;
import com.dentura.api.inventory.InventoryMovementRepository;
import com.dentura.api.ledger.LedgerEntry;
import com.dentura.api.ledger.LedgerEntryRepository;
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
import com.dentura.api.periodontogram.PeriodontogramEntry;
import com.dentura.api.periodontogram.PeriodontogramEntryRepository;
import com.dentura.api.photo.PatientPhoto;
import com.dentura.api.photo.PatientPhotoRepository;
import com.dentura.api.prescription.Prescription;
import com.dentura.api.prescription.PrescriptionRepository;
import com.dentura.api.prescription.PrescriptionTemplate;
import com.dentura.api.prescription.PrescriptionTemplateRepository;
import com.dentura.api.provider.Provider;
import com.dentura.api.provider.ProviderRepository;
import com.dentura.api.referral.OutboundReferral;
import com.dentura.api.referral.OutboundReferralRepository;
import com.dentura.api.referral.ReferralSource;
import com.dentura.api.referral.ReferralSourceRepository;
import com.dentura.api.reminder.ReminderQueueItem;
import com.dentura.api.reminder.ReminderQueueRepository;
import com.dentura.api.room.Room;
import com.dentura.api.room.RoomRepository;
import com.dentura.api.scan.PatientScan;
import com.dentura.api.scan.PatientScanRepository;
import com.dentura.api.smile.SmileDesign;
import com.dentura.api.smile.SmileDesignRepository;
import com.dentura.api.smile.SmileSuggestionEngine;
import com.dentura.api.smile.dto.SmileSuggestRequest;
import com.dentura.api.storage.PatientFileStorage;
import com.dentura.api.storage.PatientFileStorage.StoredFile;
import com.dentura.api.storage.StorageKind;
import com.dentura.api.treatment.Treatment;
import com.dentura.api.treatment.TreatmentRepository;
import com.dentura.api.work.Work;
import com.dentura.api.work.WorkRepository;

@Service
public class DemoDataSeeder {

	public static final String DEMO_PREFIX = "DEMO-";
	private static final String DEMO_SCAN_CAPTION = "DEMO scan arco superior";
	private static final ZoneId ZONE = ZoneId.of("America/El_Salvador");

	/** Minimal valid JPEG (1x1). */
	private static final byte[] DEMO_JPEG = new byte[] {
			(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xD9
	};

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
	private final PatientPhotoRepository photoRepository;
	private final PatientScanRepository scanRepository;
	private final SmileDesignRepository smileDesignRepository;
	private final PatientFileStorage fileStorage;
	private final SmileSuggestionEngine suggestionEngine;
	private final ProviderRepository providerRepository;
	private final RoomRepository roomRepository;
	private final LedgerEntryRepository ledgerEntryRepository;
	private final InventoryItemRepository inventoryItemRepository;
	private final InventoryMovementRepository inventoryMovementRepository;
	private final ConsentTemplateRepository consentTemplateRepository;
	private final PatientConsentRepository patientConsentRepository;
	private final PeriodontogramEntryRepository periodontogramEntryRepository;
	private final ReminderQueueRepository reminderQueueRepository;

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
			MedicationSeeder medicationSeeder,
			PatientPhotoRepository photoRepository,
			PatientScanRepository scanRepository,
			SmileDesignRepository smileDesignRepository,
			PatientFileStorage fileStorage,
			SmileSuggestionEngine suggestionEngine,
			ProviderRepository providerRepository,
			RoomRepository roomRepository,
			LedgerEntryRepository ledgerEntryRepository,
			InventoryItemRepository inventoryItemRepository,
			InventoryMovementRepository inventoryMovementRepository,
			ConsentTemplateRepository consentTemplateRepository,
			PatientConsentRepository patientConsentRepository,
			PeriodontogramEntryRepository periodontogramEntryRepository,
			ReminderQueueRepository reminderQueueRepository) {
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
		this.photoRepository = photoRepository;
		this.scanRepository = scanRepository;
		this.smileDesignRepository = smileDesignRepository;
		this.fileStorage = fileStorage;
		this.suggestionEngine = suggestionEngine;
		this.providerRepository = providerRepository;
		this.roomRepository = roomRepository;
		this.ledgerEntryRepository = ledgerEntryRepository;
		this.inventoryItemRepository = inventoryItemRepository;
		this.inventoryMovementRepository = inventoryMovementRepository;
		this.consentTemplateRepository = consentTemplateRepository;
		this.patientConsentRepository = patientConsentRepository;
		this.periodontogramEntryRepository = periodontogramEntryRepository;
		this.reminderQueueRepository = reminderQueueRepository;
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

		boolean coreCreated = false;
		if (!patientRepository.existsByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "001")) {
			seedCoreDemo(clinicId);
			coreCreated = true;
		}

		Map<String, Object> smileCounts = ensureSmileDemoData(clinicId);
		Map<String, Object> erpCounts = ensureExtendedErpDemo(clinicId);
		Map<String, Object> details = new LinkedHashMap<>();
		if (coreCreated) {
			details.put("core", "CREATED");
			details.put("patients", 3);
			details.put("appointments", 3);
			details.put("works", 5);
			details.put("odontogramEntries", 4);
			details.put("payments", 1);
			details.put("prescriptions", 2);
			details.put("referralSources", 2);
			details.put("outboundReferrals", 2);
		} else {
			details.put("core", "ALREADY_PRESENT");
			details.put(
					"message",
					"Pacientes DEMO-00x ya existían; se aseguró data extendida del ERP.");
		}
		details.putAll(smileCounts);
		details.putAll(erpCounts);
		details.put(
				"recordNumbers",
				List.of(
						DEMO_PREFIX + "001",
						DEMO_PREFIX + "002",
						DEMO_PREFIX + "003",
						DEMO_PREFIX + "004",
						DEMO_PREFIX + "005",
						DEMO_PREFIX + "006"));
		return DemoSeedResult.created(clinicId, details);
	}

	private void seedCoreDemo(Long clinicId) {
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
		Work luisProf = saveWork(clinicId, luis.getId(), prophylaxis, Work.PENDING, 1, prophylaxis.getPrice(), null, null);
		saveWork(clinicId, luis.getId(), extraction, Work.REJECTED, 1, extraction.getPrice(), "48", null);
		saveWork(clinicId, maria.getId(), consult, Work.PENDING, 1, consult.getPrice(), null, "Primera visita");

		ensureWorkCharge(anaConsult, "CONS — Consulta");
		ensureWorkCharge(anaResin, "RR — Resina");
		ensureWorkCharge(luisProf, "PROF — Profilaxis");

		Provider general = ensureProvider(clinicId, "General", "#3B82F6");
		Provider ortodoncia = ensureProvider(clinicId, "Dra. Sofía Ortiz", "#10B981");
		Room sala1 = ensureRoom(clinicId, "Sala 1");
		Room sala2 = ensureRoom(clinicId, "Sala 2");

		ZonedDateTime now = ZonedDateTime.now(ZONE);
		saveAppointment(
				clinicId,
				ana.getId(),
				general.getId(),
				sala1.getId(),
				now.plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0),
				45,
				Appointment.CONFIRMED,
				"Control");
		saveAppointment(
				clinicId,
				luis.getId(),
				ortodoncia.getId(),
				sala2.getId(),
				now.plusDays(2).withHour(10).withMinute(30).withSecond(0).withNano(0),
				60,
				Appointment.SCHEDULED,
				"Profilaxis");
		saveAppointment(
				clinicId,
				maria.getId(),
				general.getId(),
				sala1.getId(),
				now.plusDays(3).withHour(15).withMinute(0).withSecond(0).withNano(0),
				30,
				Appointment.SCHEDULED,
				"Consulta");

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
		ensurePaymentLedger(anaPayment);

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
	}

	/**
	 * Idempotent: photos/scans/smile designs for DEMO patients if missing.
	 */
	private Map<String, Object> ensureSmileDemoData(Long clinicId) {
		Patient ana = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "001")
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta DEMO-001"));
		Patient luis = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "002")
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta DEMO-002"));
		Patient maria = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "003")
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta DEMO-003"));

		int photos = 0;
		int scans = 0;
		int designs = 0;

		if (photoRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, ana.getId()).isEmpty()) {
			saveDemoPhoto(clinicId, ana.getId(), PatientPhoto.CLINICAL, "demo-ana-smile.jpg", "Foto clínica DEMO");
			photos++;
		}
		if (photoRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, luis.getId()).isEmpty()) {
			saveDemoPhoto(clinicId, luis.getId(), PatientPhoto.BEFORE_AFTER, "demo-luis-before.jpg", "Antes DEMO");
			photos++;
		}

		PatientScan anaScan = findDemoScan(clinicId, ana.getId());
		if (anaScan == null) {
			anaScan = saveDemoScan(clinicId, ana.getId(), PatientScan.UPPER, "demo-ana-upper.stl", DEMO_SCAN_CAPTION);
			scans++;
		}
		if (findDemoScan(clinicId, luis.getId()) == null) {
			saveDemoScan(clinicId, luis.getId(), PatientScan.FULL_ARCH, "demo-luis-full.stl", "DEMO scan arco completo");
			scans++;
		}
		if (findDemoScan(clinicId, maria.getId()) == null) {
			saveDemoScan(clinicId, maria.getId(), PatientScan.LOWER, "demo-maria-lower.stl", "DEMO scan arco inferior");
			scans++;
		}

		if (smileDesignRepository.findByClinicIdAndPatientIdOrderByUpdatedAtDesc(clinicId, ana.getId()).isEmpty()) {
			String ovalJson = suggestionEngine.suggest(new SmileSuggestRequest("OVAL", 52.0, 10.5, 0.0));
			SmileDesign draft = saveSmileDesign(
					clinicId,
					ana.getId(),
					anaScan.getId(),
					"Diseño DEMO ovalado",
					SmileDesign.DRAFT,
					ovalJson,
					"Borrador sugerido (rules-v1)");
			designs++;

			String hollywoodJson = suggestionEngine.suggest(new SmileSuggestRequest("HOLLYWOOD", 54.0, 11.2, 0.1));
			SmileDesign exported = saveSmileDesign(
					clinicId,
					ana.getId(),
					anaScan.getId(),
					"Diseño DEMO Hollywood (exportado)",
					SmileDesign.EXPORTED,
					hollywoodJson,
					"Incluye STL de exportación de prueba");
			attachDemoExport(exported);
			designs++;
		}

		if (smileDesignRepository.findByClinicIdAndPatientIdOrderByUpdatedAtDesc(clinicId, maria.getId()).isEmpty()) {
			String squareJson = suggestionEngine.suggest(new SmileSuggestRequest("SQUARE", 50.0, 10.0, -0.1));
			saveSmileDesign(
					clinicId,
					maria.getId(),
					null,
					"Diseño DEMO cuadrado",
					SmileDesign.DRAFT,
					squareJson,
					"Sin scan vinculado");
			designs++;
		}

		Map<String, Object> counts = new LinkedHashMap<>();
		counts.put("photosCreated", photos);
		counts.put("scansCreated", scans);
		counts.put("smileDesignsCreated", designs);
		return counts;
	}

	/**
	 * Idempotent: providers, rooms, extra patients, week agenda, ledger, inventory,
	 * reminders, periodontogram and consents for full ERP walkthrough.
	 */
	private Map<String, Object> ensureExtendedErpDemo(Long clinicId) {
		Map<String, Object> counts = new LinkedHashMap<>();
		int patientsCreated = 0;
		int appointmentsCreated = 0;
		int ledgerCreated = 0;
		int inventoryCreated = 0;
		int remindersCreated = 0;
		int perioCreated = 0;
		int consentsCreated = 0;

		Provider general = ensureProvider(clinicId, "General", "#3B82F6");
		Provider sofia = ensureProvider(clinicId, "Dra. Sofía Ortiz", "#10B981");
		Provider andres = ensureProvider(clinicId, "Dr. Andrés Castro", "#F59E0B");
		Room sala1 = ensureRoom(clinicId, "Sala 1");
		Room sala2 = ensureRoom(clinicId, "Sala 2");
		Room salaRayos = ensureRoom(clinicId, "Sala Rayos X");
		counts.put("providers", 3);
		counts.put("rooms", 3);

		Patient ana = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "001").orElseThrow();
		Patient luis = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "002").orElseThrow();
		Patient maria = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "003").orElseThrow();

		Patient carlos = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "004").orElse(null);
		if (carlos == null) {
			carlos = savePatient(
					clinicId,
					DEMO_PREFIX + "004",
					"Carlos",
					"Mejía",
					"MALE",
					LocalDate.of(1978, 5, 9),
					"7012-8899",
					"carlos.mejia.demo@dentura.local",
					"DUI-DEMO-004",
					null,
					null);
			patientsCreated++;
		}
		Patient elena = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "005").orElse(null);
		if (elena == null) {
			elena = savePatient(
					clinicId,
					DEMO_PREFIX + "005",
					"Elena",
					"García",
					"FEMALE",
					LocalDate.of(1995, 12, 1),
					"7555-2211",
					"elena.garcia.demo@dentura.local",
					"DUI-DEMO-005",
					null,
					null);
			patientsCreated++;
		}
		Patient pedro = patientRepository.findByClinicIdAndRecordNumber(clinicId, DEMO_PREFIX + "006").orElse(null);
		if (pedro == null) {
			pedro = savePatient(
					clinicId,
					DEMO_PREFIX + "006",
					"Pedro",
					"Vásquez",
					"MALE",
					LocalDate.of(1988, 8, 18),
					"7676-3434",
					"pedro.vasquez.demo@dentura.local",
					"DUI-DEMO-006",
					null,
					null);
			patientsCreated++;
		}

		Treatment consult = requireTreatment(clinicId, "CONS");
		Treatment prophylaxis = requireTreatment(clinicId, "PROF");
		Treatment resin = requireTreatment(clinicId, "RR");
		Treatment extraction = requireTreatment(clinicId, "EXO");
		setPriceIfZero(consult, "25.00");
		setPriceIfZero(prophylaxis, "45.00");
		setPriceIfZero(resin, "60.00");
		setPriceIfZero(extraction, "80.00");

		if (workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, carlos.getId()).isEmpty()) {
			Work charge = saveWork(clinicId, carlos.getId(), resin, Work.PENDING, 2, resin.getPrice(), "26", "MOD");
			ensureWorkCharge(charge, "RR — Resina (moroso demo)");
			Work unpaid = saveWork(clinicId, carlos.getId(), extraction, Work.PENDING, 1, extraction.getPrice(), "38", null);
			ensureWorkCharge(unpaid, "EXO — Exodoncia (moroso demo)");
		}
		if (workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, elena.getId()).isEmpty()) {
			Work w = saveWork(clinicId, elena.getId(), prophylaxis, Work.COMPLETED, 1, prophylaxis.getPrice(), null, null);
			ensureWorkCharge(w, "PROF — Profilaxis");
			Payment pay = savePayment(clinicId, elena.getId(), prophylaxis.getPrice(), Payment.TRANSFER, "Pago completo DEMO");
			ensurePaymentLedger(pay);
		}
		if (workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, pedro.getId()).isEmpty()) {
			Work w = saveWork(clinicId, pedro.getId(), consult, Work.PENDING, 1, consult.getPrice(), null, "Valoración ortodoncia");
			ensureWorkCharge(w, "CONS — Consulta");
		}

		backfillLedgerForExistingWorks(clinicId, ana.getId());
		backfillLedgerForExistingWorks(clinicId, luis.getId());
		backfillLedgerForExistingWorks(clinicId, maria.getId());
		ledgerCreated += backfillPaymentsLedger(clinicId, ana.getId());
		ledgerCreated += backfillPaymentsLedger(clinicId, elena.getId());

		if (ledgerEntryRepository.findByClinicIdAndPatientIdOrderByEntryDateAscIdAsc(clinicId, carlos.getId()).stream()
				.noneMatch(e -> LedgerEntry.ADJUSTMENT.equals(e.getType()))) {
			LedgerEntry adj = new LedgerEntry();
			adj.setClinicId(clinicId);
			adj.setPatientId(carlos.getId());
			adj.setType(LedgerEntry.ADJUSTMENT);
			adj.setAmount(new BigDecimal("-10.00"));
			adj.setDescription("Descuento DEMO por prontopago parcial");
			adj.setEntryDate(Instant.now().minusSeconds(86400));
			ledgerEntryRepository.save(adj);
			ledgerCreated++;
		}

		ZonedDateTime today = ZonedDateTime.now(ZONE).withSecond(0).withNano(0);
		String marker = "DEMO semana";
		boolean hasWeekAgenda = appointmentRepository
				.findByClinicIdAndStartAtGreaterThanEqualAndStartAtLessThanOrderByStartAtAsc(
						clinicId,
						today.minusDays(1).toInstant(),
						today.plusDays(8).toInstant())
				.stream()
				.anyMatch(a -> a.getReason() != null && a.getReason().startsWith(marker));

		if (!hasWeekAgenda) {
			Appointment[] created = new Appointment[] {
					saveAppointment(clinicId, ana.getId(), general.getId(), sala1.getId(),
							today.withHour(9).withMinute(0), 45, Appointment.CONFIRMED, marker + " control Ana"),
					saveAppointment(clinicId, luis.getId(), sofia.getId(), sala2.getId(),
							today.withHour(10).withMinute(30), 60, Appointment.SCHEDULED, marker + " profilaxis Luis"),
					saveAppointment(clinicId, maria.getId(), andres.getId(), sala1.getId(),
							today.withHour(14).withMinute(0), 30, Appointment.SCHEDULED, marker + " consulta María"),
					saveAppointment(clinicId, carlos.getId(), general.getId(), salaRayos.getId(),
							today.plusDays(1).withHour(11).withMinute(0), 40, Appointment.CONFIRMED, marker + " RX Carlos"),
					saveAppointment(clinicId, elena.getId(), sofia.getId(), sala2.getId(),
							today.plusDays(1).withHour(16).withMinute(0), 50, Appointment.SCHEDULED, marker + " ortodoncia Elena"),
					saveAppointment(clinicId, pedro.getId(), andres.getId(), sala1.getId(),
							today.plusDays(2).withHour(9).withMinute(30), 45, Appointment.SCHEDULED, marker + " valoración Pedro"),
					saveAppointment(clinicId, ana.getId(), sofia.getId(), sala2.getId(),
							today.plusDays(3).withHour(12).withMinute(0), 30, Appointment.SCHEDULED, marker + " seguimiento Ana"),
					saveAppointment(clinicId, luis.getId(), general.getId(), sala1.getId(),
							today.plusDays(4).withHour(15).withMinute(30), 60, Appointment.SCHEDULED, marker + " limpieza Luis"),
			};
			appointmentsCreated = created.length;

			remindersCreated += saveReminderIfMissing(
					clinicId,
					created[0],
					ana,
					"50378901234",
					"Hola Ana, te recordamos tu cita DEMO hoy a las 9:00 en Dentura.");
			remindersCreated += saveReminderIfMissing(
					clinicId,
					created[1],
					luis,
					"50377885566",
					"Hola Luis, te recordamos tu cita DEMO hoy a las 10:30 en Dentura.");
			remindersCreated += saveReminderIfMissing(
					clinicId,
					created[3],
					carlos,
					"50370128899",
					"Hola Carlos, te recordamos tu cita DEMO mañana a las 11:00 en Dentura.");
		}

		if (inventoryItemRepository.findByClinicIdAndSku(clinicId, "DEMO-GLOVES").isEmpty()) {
			InventoryItem gloves = saveInventoryItem(clinicId, "DEMO-GLOVES", "Guantes de látex M", "caja", "12.00", "5.00");
			saveInventoryMovement(clinicId, gloves.getId(), InventoryMovement.IN, "20.00", "Compra inicial DEMO");
			saveInventoryMovement(clinicId, gloves.getId(), InventoryMovement.OUT, "3.00", "Uso clínico DEMO");
			gloves.setQuantity(new BigDecimal("17.00"));
			inventoryItemRepository.save(gloves);
			inventoryCreated++;
		}
		if (inventoryItemRepository.findByClinicIdAndSku(clinicId, "DEMO-COMPOSITE").isEmpty()) {
			InventoryItem composite = saveInventoryItem(clinicId, "DEMO-COMPOSITE", "Resina composite A2", "jeringa", "8.00", "4.00");
			saveInventoryMovement(clinicId, composite.getId(), InventoryMovement.IN, "10.00", "Stock inicial DEMO");
			saveInventoryMovement(clinicId, composite.getId(), InventoryMovement.OUT, "7.00", "Consumo DEMO (bajo mínimo)");
			composite.setQuantity(new BigDecimal("3.00"));
			inventoryItemRepository.save(composite);
			inventoryCreated++;
		}
		if (inventoryItemRepository.findByClinicIdAndSku(clinicId, "DEMO-ANES").isEmpty()) {
			InventoryItem anes = saveInventoryItem(clinicId, "DEMO-ANES", "Anestesia lidocaína 2%", "cartucho", "40.00", "15.00");
			saveInventoryMovement(clinicId, anes.getId(), InventoryMovement.IN, "50.00", "Pedido lab DEMO");
			saveInventoryMovement(clinicId, anes.getId(), InventoryMovement.ADJUST, "-5.00", "Ajuste inventario DEMO");
			anes.setQuantity(new BigDecimal("45.00"));
			inventoryItemRepository.save(anes);
			inventoryCreated++;
		}

		ConsentTemplate tpl = consentTemplateRepository
				.findFirstByClinicIdAndTitle(clinicId, "Consentimiento informado DEMO")
				.orElseGet(() -> {
					ConsentTemplate t = new ConsentTemplate();
					t.setClinicId(clinicId);
					t.setTitle("Consentimiento informado DEMO");
					t.setBodyHtml(
							"<p>Autorizo el tratamiento odontológico propuesto en Dentura (datos de ejemplo).</p>"
									+ "<p>Entiendo riesgos, alternativas y cuidados posteriores.</p>");
					t.setActive(true);
					return consentTemplateRepository.save(t);
				});
		if (patientConsentRepository.findByClinicIdAndPatientIdOrderByAcceptedAtDesc(clinicId, ana.getId()).isEmpty()) {
			PatientConsent consent = new PatientConsent();
			consent.setClinicId(clinicId);
			consent.setPatientId(ana.getId());
			consent.setTemplateId(tpl.getId());
			consent.setSignerName("Ana López");
			consent.setAcceptedAt(Instant.now().minusSeconds(7200));
			consent.setNotes("Firmado en recepción DEMO");
			patientConsentRepository.save(consent);
			consentsCreated++;
		}
		if (patientConsentRepository.findByClinicIdAndPatientIdOrderByAcceptedAtDesc(clinicId, carlos.getId()).isEmpty()) {
			PatientConsent consent = new PatientConsent();
			consent.setClinicId(clinicId);
			consent.setPatientId(carlos.getId());
			consent.setTemplateId(tpl.getId());
			consent.setSignerName("Carlos Mejía");
			consent.setAcceptedAt(Instant.now().minusSeconds(3600));
			patientConsentRepository.save(consent);
			consentsCreated++;
		}

		if (periodontogramEntryRepository
				.findByClinicIdAndPatientIdOrderByToothAscRecordedAtDesc(clinicId, luis.getId())
				.isEmpty()) {
			perioCreated += savePerio(clinicId, luis.getId(), "16", "{\"pd\":[3,4,3],\"bop\":[false,true,false],\"recession\":[0,1,0]}");
			perioCreated += savePerio(clinicId, luis.getId(), "26", "{\"pd\":[2,3,2],\"bop\":[false,false,false],\"recession\":[0,0,0]}");
			perioCreated += savePerio(clinicId, luis.getId(), "36", "{\"pd\":[4,5,4],\"bop\":[true,true,false],\"recession\":[1,1,0]}");
		}

		counts.put("extraPatientsCreated", patientsCreated);
		counts.put("weekAppointmentsCreated", appointmentsCreated);
		counts.put("ledgerExtrasCreated", ledgerCreated);
		counts.put("inventoryItemsCreated", inventoryCreated);
		counts.put("remindersCreated", remindersCreated);
		counts.put("periodontogramCreated", perioCreated);
		counts.put("consentsCreated", consentsCreated);
		return counts;
	}

	private Provider ensureProvider(Long clinicId, String name, String color) {
		return providerRepository.findFirstByClinicIdAndName(clinicId, name).orElseGet(() -> {
			Provider provider = new Provider();
			provider.setClinicId(clinicId);
			provider.setName(name);
			provider.setColor(color);
			provider.setActive(true);
			return providerRepository.save(provider);
		});
	}

	private Room ensureRoom(Long clinicId, String name) {
		return roomRepository.findFirstByClinicIdAndName(clinicId, name).orElseGet(() -> {
			Room room = new Room();
			room.setClinicId(clinicId);
			room.setName(name);
			room.setActive(true);
			return roomRepository.save(room);
		});
	}

	private void backfillLedgerForExistingWorks(Long clinicId, Long patientId) {
		for (Work work : workRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId)) {
			if (Work.REJECTED.equals(work.getStatus())) {
				continue;
			}
			ensureWorkCharge(work, "Cargo trabajo #" + work.getId());
		}
	}

	private int backfillPaymentsLedger(Long clinicId, Long patientId) {
		int created = 0;
		for (Payment payment : paymentRepository.findByClinicIdAndPatientId(clinicId, patientId)) {
			if (ledgerEntryRepository.findByPaymentIdAndType(payment.getId(), LedgerEntry.PAYMENT).isEmpty()) {
				ensurePaymentLedger(payment);
				created++;
			}
		}
		return created;
	}

	private void ensureWorkCharge(Work work, String description) {
		if (work == null || work.getId() == null || Work.REJECTED.equals(work.getStatus())) {
			return;
		}
		if (ledgerEntryRepository.existsByWorkIdAndType(work.getId(), LedgerEntry.CHARGE)) {
			return;
		}
		BigDecimal amount = work.getUnitPrice().multiply(BigDecimal.valueOf(work.getQuantity()));
		if (amount.compareTo(BigDecimal.ZERO) <= 0) {
			return;
		}
		LedgerEntry entry = new LedgerEntry();
		entry.setClinicId(work.getClinicId());
		entry.setPatientId(work.getPatientId());
		entry.setWorkId(work.getId());
		entry.setType(LedgerEntry.CHARGE);
		entry.setAmount(amount);
		entry.setDescription(description);
		entry.setEntryDate(Instant.now().minusSeconds(7200));
		ledgerEntryRepository.save(entry);
	}

	private void ensurePaymentLedger(Payment payment) {
		if (ledgerEntryRepository.findByPaymentIdAndType(payment.getId(), LedgerEntry.PAYMENT).isPresent()) {
			return;
		}
		LedgerEntry entry = new LedgerEntry();
		entry.setClinicId(payment.getClinicId());
		entry.setPatientId(payment.getPatientId());
		entry.setPaymentId(payment.getId());
		entry.setType(LedgerEntry.PAYMENT);
		entry.setAmount(payment.getAmount());
		entry.setDescription("Pago recibo #" + payment.getReceiptNumber());
		entry.setEntryDate(payment.getPaidAt() == null ? Instant.now() : payment.getPaidAt());
		ledgerEntryRepository.save(entry);
	}

	private InventoryItem saveInventoryItem(
			Long clinicId,
			String sku,
			String name,
			String unit,
			String quantity,
			String minQuantity) {
		InventoryItem item = new InventoryItem();
		item.setClinicId(clinicId);
		item.setSku(sku);
		item.setName(name);
		item.setUnit(unit);
		item.setQuantity(new BigDecimal(quantity));
		item.setMinQuantity(new BigDecimal(minQuantity));
		item.setActive(true);
		return inventoryItemRepository.save(item);
	}

	private void saveInventoryMovement(Long clinicId, Long itemId, String type, String quantity, String note) {
		InventoryMovement movement = new InventoryMovement();
		movement.setClinicId(clinicId);
		movement.setItemId(itemId);
		movement.setType(type);
		movement.setQuantity(new BigDecimal(quantity).abs());
		movement.setNote(note);
		inventoryMovementRepository.save(movement);
	}

	private int saveReminderIfMissing(Long clinicId, Appointment appointment, Patient patient, String phone, String body) {
		if (reminderQueueRepository.existsByAppointmentId(appointment.getId())) {
			return 0;
		}
		ReminderQueueItem item = new ReminderQueueItem();
		item.setClinicId(clinicId);
		item.setAppointmentId(appointment.getId());
		item.setPatientId(patient.getId());
		item.setPhoneNormalized(phone);
		item.setMessageBody(body);
		item.setWaMeUrl("https://wa.me/" + phone + "?text=" + java.net.URLEncoder.encode(body, StandardCharsets.UTF_8));
		item.setStatus(ReminderQueueItem.PENDING);
		item.setScheduledFor(appointment.getStartAt().minusSeconds(3600));
		reminderQueueRepository.save(item);
		return 1;
	}

	private int savePerio(Long clinicId, Long patientId, String tooth, String valuesJson) {
		PeriodontogramEntry entry = new PeriodontogramEntry();
		entry.setClinicId(clinicId);
		entry.setPatientId(patientId);
		entry.setTooth(tooth);
		entry.setValuesJson(valuesJson);
		entry.setNotes("Registro DEMO");
		entry.setRecordedAt(Instant.now().minusSeconds(86400));
		periodontogramEntryRepository.save(entry);
		return 1;
	}

	private PatientScan findDemoScan(Long clinicId, Long patientId) {
		return scanRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId).stream()
				.filter(scan -> scan.getCaption() != null && scan.getCaption().startsWith("DEMO"))
				.findFirst()
				.orElse(null);
	}

	private void saveDemoPhoto(Long clinicId, Long patientId, String category, String fileName, String caption) {
		StoredFile stored = fileStorage.saveBytes(
				clinicId,
				patientId,
				category,
				fileName,
				"image/jpeg",
				DEMO_JPEG,
				StorageKind.IMAGE);
		PatientPhoto photo = new PatientPhoto();
		photo.setClinicId(clinicId);
		photo.setPatientId(patientId);
		photo.setCategory(category);
		photo.setFileName(stored.originalFileName());
		photo.setContentType(stored.contentType());
		photo.setSizeBytes(stored.sizeBytes());
		photo.setRelativePath(stored.relativePath());
		photo.setCaption(caption);
		photo.setTakenAt(Instant.now().minusSeconds(86400));
		photoRepository.save(photo);
	}

	private PatientScan saveDemoScan(
			Long clinicId,
			Long patientId,
			String arch,
			String fileName,
			String caption) {
		byte[] stl = demoStlAscii(arch);
		StoredFile stored = fileStorage.saveBytes(
				clinicId,
				patientId,
				"SCANS_" + arch,
				fileName,
				"model/stl",
				stl,
				StorageKind.MESH);
		PatientScan scan = new PatientScan();
		scan.setClinicId(clinicId);
		scan.setPatientId(patientId);
		scan.setArch(arch);
		scan.setFileName(stored.originalFileName());
		scan.setContentType(stored.contentType());
		scan.setSizeBytes(stored.sizeBytes());
		scan.setRelativePath(stored.relativePath());
		scan.setCaption(caption);
		return scanRepository.save(scan);
	}

	private SmileDesign saveSmileDesign(
			Long clinicId,
			Long patientId,
			Long scanId,
			String name,
			String status,
			String designJson,
			String notes) {
		SmileDesign design = new SmileDesign();
		design.setClinicId(clinicId);
		design.setPatientId(patientId);
		design.setScanId(scanId);
		design.setName(name);
		design.setStatus(status);
		design.setDesignJson(designJson);
		design.setNotes(notes);
		design.setVersion(1);
		return smileDesignRepository.save(design);
	}

	private void attachDemoExport(SmileDesign design) {
		byte[] stl = demoStlAscii("EXPORT");
		StoredFile stored = fileStorage.saveBytes(
				design.getClinicId(),
				design.getPatientId(),
				"SMILE_EXPORT",
				"demo-smile-export.stl",
				"model/stl",
				stl,
				StorageKind.DESIGN_EXPORT);
		design.setExportRelativePath(stored.relativePath());
		design.setExportFileName(stored.originalFileName());
		design.setExportContentType(stored.contentType());
		design.setExportSizeBytes(stored.sizeBytes());
		design.setStatus(SmileDesign.EXPORTED);
		design.setVersion(design.getVersion() + 1);
		smileDesignRepository.save(design);
	}

	private static byte[] demoStlAscii(String label) {
		String stl = """
				solid dentura_demo_%s
				  facet normal 0 0 1
				    outer loop
				      vertex 0 0 0
				      vertex 8 0 0
				      vertex 0 6 0
				    endloop
				  endfacet
				  facet normal 0 0 1
				    outer loop
				      vertex 8 0 0
				      vertex 8 6 0
				      vertex 0 6 0
				    endloop
				  endfacet
				endsolid dentura_demo_%s
				""".formatted(label, label);
		return stl.getBytes(StandardCharsets.US_ASCII);
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

	private Appointment saveAppointment(
			Long clinicId,
			Long patientId,
			Long providerId,
			Long roomId,
			ZonedDateTime start,
			int minutes,
			String status,
			String reason) {
		Appointment appointment = new Appointment();
		appointment.setClinicId(clinicId);
		appointment.setPatientId(patientId);
		appointment.setProviderId(providerId);
		appointment.setRoomId(roomId);
		appointment.setStartAt(start.toInstant());
		appointment.setEndAt(start.plusMinutes(minutes).toInstant());
		appointment.setStatus(status);
		appointment.setReason(reason);
		return appointmentRepository.save(appointment);
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
	}
}
