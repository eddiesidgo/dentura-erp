package com.dentura.api.referral;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicFeatureGuard;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.referral.dto.OutboundReferralRequest;
import com.dentura.api.referral.dto.OutboundReferralResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class OutboundReferralService {

	private static final Set<String> STATUSES = Set.of(
			OutboundReferral.DRAFT,
			OutboundReferral.SENT,
			OutboundReferral.COMPLETED,
			OutboundReferral.CANCELLED);

	private final OutboundReferralRepository referralRepository;
	private final PatientRepository patientRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final ClinicFeatureGuard clinicFeatureGuard;

	public OutboundReferralService(
			OutboundReferralRepository referralRepository,
			PatientRepository patientRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			ClinicFeatureGuard clinicFeatureGuard) {
		this.referralRepository = referralRepository;
		this.patientRepository = patientRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.clinicFeatureGuard = clinicFeatureGuard;
	}

	@Transactional(readOnly = true)
	public List<OutboundReferralResponse> list(Long patientId) {
		permissionService.require(Permission.REFERRALS_READ);
		clinicFeatureGuard.requireReferralsOutbound();
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return referralRepository.findByClinicIdAndPatientIdOrderByReferredAtDesc(clinicId, patientId).stream()
				.map(OutboundReferralResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public OutboundReferralResponse get(Long id) {
		permissionService.require(Permission.REFERRALS_READ);
		clinicFeatureGuard.requireReferralsOutbound();
		return OutboundReferralResponse.from(findOrThrow(id));
	}

	@Transactional
	public OutboundReferralResponse create(OutboundReferralRequest request) {
		permissionService.require(Permission.REFERRALS_WRITE);
		clinicFeatureGuard.requireReferralsOutbound();
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		OutboundReferral referral = new OutboundReferral();
		referral.setClinicId(clinicId);
		apply(referral, request);
		return OutboundReferralResponse.from(referralRepository.save(referral));
	}

	@Transactional
	public OutboundReferralResponse update(Long id, OutboundReferralRequest request) {
		permissionService.require(Permission.REFERRALS_WRITE);
		clinicFeatureGuard.requireReferralsOutbound();
		Long clinicId = clinicAccess.requireClinicId();
		OutboundReferral referral = findOrThrow(id);
		requirePatient(request.patientId(), clinicId);
		apply(referral, request);
		return OutboundReferralResponse.from(referralRepository.save(referral));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.REFERRALS_DELETE);
		clinicFeatureGuard.requireReferralsOutbound();
		referralRepository.delete(findOrThrow(id));
	}

	private void apply(OutboundReferral referral, OutboundReferralRequest request) {
		referral.setPatientId(request.patientId());
		referral.setSpecialty(request.specialty());
		referral.setToName(request.toName());
		referral.setReason(request.reason());
		referral.setStatus(request.status() == null ? OutboundReferral.DRAFT : requireStatus(request.status()));
		referral.setReferredAt(request.referredAt() == null ? Instant.now() : request.referredAt());
		referral.setNotes(request.notes());
	}

	private String requireStatus(String status) {
		String value = status.toUpperCase(Locale.ROOT);
		if (!STATUSES.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de referido inválido");
		}
		return value;
	}

	private OutboundReferral findOrThrow(Long id) {
		return referralRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referido no encontrado"));
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
