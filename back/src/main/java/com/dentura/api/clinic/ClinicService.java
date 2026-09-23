package com.dentura.api.clinic;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.auth.JwtService;
import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.auth.dto.UserDto;
import com.dentura.api.clinic.dto.ClinicIdentityResponse;
import com.dentura.api.clinic.dto.CreateClinicRequest;
import com.dentura.api.clinic.dto.UpdateClinicRequest;
import com.dentura.api.domain.User;
import com.dentura.api.medication.MedicationSeeder;
import com.dentura.api.provider.Provider;
import com.dentura.api.provider.ProviderRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.role.RoleCatalog;
import com.dentura.api.treatment.TreatmentSeeder;

@Service
public class ClinicService {

	public static final String DEFAULT_CODE = "default";

	private final ClinicRepository clinicRepository;
	private final ClinicAccess clinicAccess;
	private final JwtService jwtService;
	private final RoleCatalog roleCatalog;
	private final PermissionService permissionService;
	private final TreatmentSeeder treatmentSeeder;
	private final MedicationSeeder medicationSeeder;
	private final ClinicLogoStorage clinicLogoStorage;
	private final ProviderRepository providerRepository;

	public ClinicService(
			ClinicRepository clinicRepository,
			ClinicAccess clinicAccess,
			JwtService jwtService,
			RoleCatalog roleCatalog,
			PermissionService permissionService,
			TreatmentSeeder treatmentSeeder,
			MedicationSeeder medicationSeeder,
			ClinicLogoStorage clinicLogoStorage,
			ProviderRepository providerRepository) {
		this.clinicRepository = clinicRepository;
		this.clinicAccess = clinicAccess;
		this.jwtService = jwtService;
		this.roleCatalog = roleCatalog;
		this.permissionService = permissionService;
		this.treatmentSeeder = treatmentSeeder;
		this.medicationSeeder = medicationSeeder;
		this.clinicLogoStorage = clinicLogoStorage;
		this.providerRepository = providerRepository;
	}

	@Transactional(readOnly = true)
	public ClinicIdentityResponse publicIdentity() {
		return ClinicIdentityResponse.from(requireByCode(DEFAULT_CODE));
	}

	@Transactional(readOnly = true)
	public ClinicIdentityResponse current() {
		return ClinicIdentityResponse.from(requireById(clinicAccess.requireClinicId()));
	}

	@Transactional(readOnly = true)
	public List<ClinicIdentityResponse> list() {
		clinicAccess.requireSuperAdmin();
		return clinicRepository.findAllByActiveTrueOrderByNameAsc().stream()
				.map(ClinicIdentityResponse::from)
				.toList();
	}

	@Transactional
	public ClinicIdentityResponse create(CreateClinicRequest request) {
		clinicAccess.requireSuperAdmin();
		String code = request.code().trim().toLowerCase();
		if (clinicRepository.existsByCode(code)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una clínica con ese código");
		}
		Clinic clinic = new Clinic();
		clinic.setCode(code);
		clinic.setName(request.name().trim());
		ClinicDeliveryPreset.from(request.preset()).applyTo(clinic);
		Clinic saved = clinicRepository.save(clinic);
		roleCatalog.ensureClinicRoles(saved.getId());
		treatmentSeeder.ensureClinicCatalog(saved.getId());
		medicationSeeder.ensureClinicCatalog(saved.getId());
		ensureDefaultProvider(saved.getId());
		return ClinicIdentityResponse.from(saved);
	}

	private void ensureDefaultProvider(Long clinicId) {
		if (providerRepository.findFirstByClinicIdAndName(clinicId, "General").isPresent()) {
			return;
		}
		Provider provider = new Provider();
		provider.setClinicId(clinicId);
		provider.setName("General");
		provider.setColor("#3B82F6");
		provider.setActive(true);
		providerRepository.save(provider);
	}

	@Transactional
	public ClinicIdentityResponse updateCurrent(UpdateClinicRequest request) {
		permissionService.require(Permission.CLINIC_MANAGE);
		Clinic clinic = requireById(clinicAccess.requireClinicId());
		clinic.setName(request.name().trim());
		clinic.setLogoUrl(blankToNull(request.logoUrl()));
		clinic.setPhone(blankToNull(request.phone()));
		clinic.setEmail(blankToNull(request.email()));
		clinic.setAddress(blankToNull(request.address()));
		clinic.setCity(blankToNull(request.city()));
		clinic.setDepartment(blankToNull(request.department()));
		clinic.setNit(blankToNull(request.nit()));
		if (request.themeMode() != null) {
			clinic.setThemeMode(request.themeMode());
		}
		if (request.themeColor() != null) {
			clinic.setThemeColor(request.themeColor());
		}
		if (request.primaryColorLevel() != null) {
			clinic.setPrimaryColorLevel(request.primaryColorLevel());
		}
		if (request.navMode() != null) {
			clinic.setNavMode(request.navMode());
		}
		if (request.layoutType() != null) {
			clinic.setLayoutType(request.layoutType());
		}
		if (request.direction() != null) {
			clinic.setDirection(request.direction());
		}
		if (request.providerMode() != null) {
			clinic.setProviderMode(request.providerMode());
		}
		if (request.roomMode() != null) {
			clinic.setRoomMode(request.roomMode());
		}
		if (request.referralsInboundEnabled() != null) {
			clinic.setReferralsInboundEnabled(request.referralsInboundEnabled());
		}
		if (request.referralsOutboundEnabled() != null) {
			clinic.setReferralsOutboundEnabled(request.referralsOutboundEnabled());
		}
		if (request.reminderHoursBefore() != null) {
			clinic.setReminderHoursBefore(request.reminderHoursBefore());
		}
		if (request.reminderMessageTemplate() != null) {
			String template = request.reminderMessageTemplate().trim();
			clinic.setReminderMessageTemplate(template.isEmpty() ? null : template);
		}
		if (request.reminderDefaultCountryCode() != null) {
			String country = request.reminderDefaultCountryCode().trim();
			if (!country.isEmpty()) {
				clinic.setReminderDefaultCountryCode(country);
			}
		}
		return ClinicIdentityResponse.from(clinicRepository.save(clinic));
	}

	@Transactional
	public ClinicIdentityResponse uploadLogo(MultipartFile file) {
		permissionService.require(Permission.CLINIC_MANAGE);
		Clinic clinic = requireById(clinicAccess.requireClinicId());
		clinicLogoStorage.save(clinic.getId(), file);
		clinic.setLogoUrl(clinicLogoStorage.logoApiPath(clinic.getId()));
		return ClinicIdentityResponse.from(clinicRepository.save(clinic));
	}

	@Transactional(readOnly = true)
	public ResponseEntity<byte[]> serveLogo(Long clinicId) {
		Clinic clinic = requireById(clinicId);
		return clinicLogoStorage.load(clinic.getId())
				.map(logo -> ResponseEntity.ok()
						.header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
						.contentType(MediaType.parseMediaType(logo.contentType()))
						.body(logo.bytes()))
				.orElseGet(() -> externalLogoRedirect(clinic.getLogoUrl()));
	}

	@Transactional(readOnly = true)
	public AuthResponse switchClinic(Long clinicId) {
		clinicAccess.requireSuperAdmin();
		Clinic clinic = requireById(clinicId);
		if (!clinic.isActive()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La clínica no está activa");
		}
		User user = clinicAccess.currentUser().getUser();
		return new AuthResponse(
				jwtService.generateToken(user, clinic.getId()),
				UserDto.from(user, clinic.getId(), permissionService.codesFor(user, clinic.getId())),
				ClinicIdentityResponse.from(clinic));
	}

	public Clinic requireById(Long id) {
		return clinicRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));
	}

	public Clinic requireByCode(String code) {
		return clinicRepository.findByCode(code)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica no encontrada"));
	}

	private String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private ResponseEntity<byte[]> externalLogoRedirect(String logoUrl) {
		if (logoUrl != null && logoUrl.startsWith("http")) {
			return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
					.header(HttpHeaders.LOCATION, logoUrl)
					.build();
		}
		return ResponseEntity.notFound().build();
	}
}
