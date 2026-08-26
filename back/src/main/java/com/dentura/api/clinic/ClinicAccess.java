package com.dentura.api.clinic;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.auth.AppUserDetails;

@Component
public class ClinicAccess {

	public static final String SUPER_ADMIN = "super_admin";

	private final ClinicRepository clinicRepository;

	public ClinicAccess(ClinicRepository clinicRepository) {
		this.clinicRepository = clinicRepository;
	}

	public AppUserDetails currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails details)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return details;
	}

	public boolean isSuperAdmin() {
		return currentUser().getUser().getAuthorities().contains(SUPER_ADMIN);
	}

	public void requireSuperAdmin() {
		if (!isSuperAdmin()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el super admin puede realizar esta acción");
		}
	}

	public Long requireClinicId() {
		Long clinicId = currentUser().getActiveClinicId();
		if (clinicId != null) {
			return clinicId;
		}
		if (isSuperAdmin()) {
			return clinicRepository.findByCode(ClinicService.DEFAULT_CODE)
					.map(Clinic::getId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleccione una clínica"));
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleccione una clínica");
	}
}
