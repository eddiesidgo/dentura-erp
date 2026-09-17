package com.dentura.api.provider;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.provider.dto.ProviderRequest;
import com.dentura.api.provider.dto.ProviderResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;

@Service
public class ProviderService {

	private final ProviderRepository providerRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public ProviderService(
			ProviderRepository providerRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.providerRepository = providerRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<ProviderResponse> list(Boolean activeOnly) {
		permissionService.require(Permission.AGENDA_READ);
		Long clinicId = clinicAccess.requireClinicId();
		List<Provider> providers = Boolean.TRUE.equals(activeOnly)
				? providerRepository.findByClinicIdAndActiveTrueOrderByNameAsc(clinicId)
				: providerRepository.findByClinicIdOrderByNameAsc(clinicId);
		return providers.stream().map(ProviderResponse::from).toList();
	}

	@Transactional
	public ProviderResponse create(ProviderRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		Provider provider = new Provider();
		provider.setClinicId(clinicAccess.requireClinicId());
		apply(provider, request);
		return ProviderResponse.from(providerRepository.save(provider));
	}

	@Transactional
	public ProviderResponse update(Long id, ProviderRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		Provider provider = findOrThrow(id);
		apply(provider, request);
		return ProviderResponse.from(providerRepository.save(provider));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.AGENDA_WRITE);
		providerRepository.delete(findOrThrow(id));
	}

	Provider findOrThrow(Long id) {
		return providerRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profesional no encontrado"));
	}

	private void apply(Provider provider, ProviderRequest request) {
		provider.setName(request.name());
		provider.setColor(request.color() == null ? "#3B82F6" : request.color());
		provider.setUserId(request.userId());
		if (request.active() != null) {
			provider.setActive(request.active());
		}
	}
}
