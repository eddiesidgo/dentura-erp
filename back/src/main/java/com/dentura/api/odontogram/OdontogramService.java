package com.dentura.api.odontogram;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.odontogram.dto.OdontogramEntryRequest;
import com.dentura.api.odontogram.dto.OdontogramEntryResponse;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.work.WorkRepository;

@Service
public class OdontogramService {

	private static final Set<String> CONDITIONS = Set.of(
			OdontogramEntry.CARIES,
			OdontogramEntry.FILLING,
			OdontogramEntry.MISSING,
			OdontogramEntry.CROWN,
			OdontogramEntry.ENDO,
			OdontogramEntry.IMPLANT,
			OdontogramEntry.EXTRACTION_PLANNED,
			OdontogramEntry.OTHER);
	private static final Set<String> STATUSES = Set.of(
			OdontogramEntry.EXISTING,
			OdontogramEntry.PLANNED,
			OdontogramEntry.COMPLETED);
	private static final Pattern TOOTH_PATTERN = Pattern.compile("^[1-8][1-8]$");
	private static final Pattern SURFACES_PATTERN = Pattern.compile("^[MODBLV]*$", Pattern.CASE_INSENSITIVE);

	private final OdontogramEntryRepository repository;
	private final PatientRepository patientRepository;
	private final WorkRepository workRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public OdontogramService(
			OdontogramEntryRepository repository,
			PatientRepository patientRepository,
			WorkRepository workRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.repository = repository;
		this.patientRepository = patientRepository;
		this.workRepository = workRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<OdontogramEntryResponse> list(Long patientId) {
		permissionService.require(Permission.ODONTOGRAM_READ);
		if (patientId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar el paciente");
		}
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return repository.findByClinicIdAndPatientIdOrderByToothAscCreatedAtDesc(clinicId, patientId).stream()
				.map(OdontogramEntryResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public OdontogramEntryResponse get(Long id) {
		permissionService.require(Permission.ODONTOGRAM_READ);
		return OdontogramEntryResponse.from(findOrThrow(id));
	}

	@Transactional
	public OdontogramEntryResponse create(OdontogramEntryRequest request) {
		permissionService.require(Permission.ODONTOGRAM_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		OdontogramEntry entry = new OdontogramEntry();
		entry.setClinicId(clinicId);
		apply(entry, request, clinicId);
		return OdontogramEntryResponse.from(repository.save(entry));
	}

	@Transactional
	public OdontogramEntryResponse update(Long id, OdontogramEntryRequest request) {
		permissionService.require(Permission.ODONTOGRAM_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		OdontogramEntry entry = findOrThrow(id);
		requirePatient(request.patientId(), clinicId);
		apply(entry, request, clinicId);
		return OdontogramEntryResponse.from(repository.save(entry));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.ODONTOGRAM_DELETE);
		repository.delete(findOrThrow(id));
	}

	private void apply(OdontogramEntry entry, OdontogramEntryRequest request, Long clinicId) {
		entry.setPatientId(request.patientId());
		entry.setTooth(requireTooth(request.tooth()));
		entry.setSurfaces(normalizeSurfaces(request.surfaces()));
		entry.setCondition(requireCondition(request.condition()));
		entry.setStatus(request.status() == null ? OdontogramEntry.EXISTING : requireStatus(request.status()));
		entry.setWorkId(resolveWorkId(request.workId(), request.patientId(), clinicId));
		entry.setNotes(request.notes());
	}

	private Long resolveWorkId(Long workId, Long patientId, Long clinicId) {
		if (workId == null) {
			return null;
		}
		return workRepository.findByIdAndClinicId(workId, clinicId)
				.filter(work -> patientId.equals(work.getPatientId()))
				.map(work -> work.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trabajo no válido"));
	}

	private String requireTooth(String tooth) {
		if (tooth == null || !TOOTH_PATTERN.matcher(tooth).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pieza dental FDI inválida");
		}
		return tooth;
	}

	private String normalizeSurfaces(String surfaces) {
		if (surfaces == null) {
			return null;
		}
		String upper = surfaces.toUpperCase(Locale.ROOT).replaceAll("[^MODBLV]", "");
		if (!SURFACES_PATTERN.matcher(upper).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Superficies inválidas");
		}
		return upper.chars().mapToObj(c -> String.valueOf((char) c)).distinct().sorted()
				.collect(Collectors.joining());
	}

	private String requireCondition(String condition) {
		String value = condition.toUpperCase(Locale.ROOT);
		if (!CONDITIONS.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Condición de odontograma inválida");
		}
		return value;
	}

	private String requireStatus(String status) {
		String value = status.toUpperCase(Locale.ROOT);
		if (!STATUSES.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de odontograma inválido");
		}
		return value;
	}

	private OdontogramEntry findOrThrow(Long id) {
		return repository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hallazgo no encontrado"));
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}
}
