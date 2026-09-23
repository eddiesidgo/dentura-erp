package com.dentura.api.referral;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.clinic.ClinicFeatureGuard;
import com.dentura.api.referral.dto.ReferralSourceRequest;
import com.dentura.api.referral.dto.ReferralSourceResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class ReferralSourceService {

	private static final Set<String> TYPES = Set.of(
			ReferralSource.PERSON, ReferralSource.CLINIC, ReferralSource.OTHER);

	private final ReferralSourceRepository sourceRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final ClinicFeatureGuard clinicFeatureGuard;

	public ReferralSourceService(
			ReferralSourceRepository sourceRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			ClinicFeatureGuard clinicFeatureGuard) {
		this.sourceRepository = sourceRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.clinicFeatureGuard = clinicFeatureGuard;
	}

	@Transactional(readOnly = true)
	public List<ReferralSourceResponse> list() {
		permissionService.require(Permission.REFERRALS_READ);
		clinicFeatureGuard.requireReferralsInbound();
		return sourceRepository.findByClinicIdOrderByNameAsc(clinicAccess.requireClinicId()).stream()
				.map(ReferralSourceResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ReferralSourceResponse get(Long id) {
		permissionService.require(Permission.REFERRALS_READ);
		clinicFeatureGuard.requireReferralsInbound();
		return ReferralSourceResponse.from(findOrThrow(id));
	}

	@Transactional
	public ReferralSourceResponse create(ReferralSourceRequest request) {
		permissionService.require(Permission.REFERRALS_WRITE);
		clinicFeatureGuard.requireReferralsInbound();
		ReferralSource source = new ReferralSource();
		source.setClinicId(clinicAccess.requireClinicId());
		apply(source, request);
		return ReferralSourceResponse.from(sourceRepository.save(source));
	}

	@Transactional
	public ReferralSourceResponse update(Long id, ReferralSourceRequest request) {
		permissionService.require(Permission.REFERRALS_WRITE);
		clinicFeatureGuard.requireReferralsInbound();
		ReferralSource source = findOrThrow(id);
		apply(source, request);
		return ReferralSourceResponse.from(sourceRepository.save(source));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.REFERRALS_DELETE);
		clinicFeatureGuard.requireReferralsInbound();
		sourceRepository.delete(findOrThrow(id));
	}

	ReferralSource findOrThrow(Long id) {
		return sourceRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuente de referidos no encontrada"));
	}

	private void apply(ReferralSource source, ReferralSourceRequest request) {
		source.setName(request.name());
		source.setType(requireType(request.type()));
		source.setPhone(request.phone());
		if (request.active() != null) {
			source.setActive(request.active());
		}
	}

	private String requireType(String type) {
		String value = type.toUpperCase(Locale.ROOT);
		if (!TYPES.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de fuente inválido");
		}
		return value;
	}
}
