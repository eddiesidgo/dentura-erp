package com.dentura.api.clinic;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ClinicFeatureGuard {

	private final ClinicAccess clinicAccess;
	private final ClinicRepository clinicRepository;

	public ClinicFeatureGuard(ClinicAccess clinicAccess, ClinicRepository clinicRepository) {
		this.clinicAccess = clinicAccess;
		this.clinicRepository = clinicRepository;
	}

	public Clinic requireClinic() {
		return clinicRepository.findById(clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));
	}

	public Clinic requireReferralsInbound() {
		Clinic clinic = requireClinic();
		if (!clinic.isReferralsInboundEnabled()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los referidos de entrada están desactivados en esta clínica");
		}
		return clinic;
	}

	public Clinic requireReferralsOutbound() {
		Clinic clinic = requireClinic();
		if (!clinic.isReferralsOutboundEnabled()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los referidos de salida están desactivados en esta clínica");
		}
		return clinic;
	}
}
