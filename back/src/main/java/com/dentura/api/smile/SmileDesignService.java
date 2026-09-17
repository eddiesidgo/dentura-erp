package com.dentura.api.smile;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.scan.ScanService;
import com.dentura.api.smile.dto.SmileDesignRequest;
import com.dentura.api.smile.dto.SmileDesignResponse;
import com.dentura.api.smile.dto.SmileSuggestRequest;
import com.dentura.api.storage.PatientFileStorage;
import com.dentura.api.storage.PatientFileStorage.StoredFile;
import com.dentura.api.storage.StorageKind;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SmileDesignService {

	private final SmileDesignRepository designRepository;
	private final PatientRepository patientRepository;
	private final ScanService scanService;
	private final PatientFileStorage fileStorage;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;
	private final SmileSuggestionEngine suggestionEngine;
	private final ObjectMapper objectMapper;

	public SmileDesignService(
			SmileDesignRepository designRepository,
			PatientRepository patientRepository,
			ScanService scanService,
			PatientFileStorage fileStorage,
			ClinicAccess clinicAccess,
			PermissionService permissionService,
			SmileSuggestionEngine suggestionEngine,
			ObjectMapper objectMapper) {
		this.designRepository = designRepository;
		this.patientRepository = patientRepository;
		this.scanService = scanService;
		this.fileStorage = fileStorage;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
		this.suggestionEngine = suggestionEngine;
		this.objectMapper = objectMapper;
	}

	@Transactional(readOnly = true)
	public List<SmileDesignResponse> list(Long patientId) {
		permissionService.require(Permission.SMILE_DESIGN_READ);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		return designRepository.findByClinicIdAndPatientIdOrderByUpdatedAtDesc(clinicId, patientId).stream()
				.map(SmileDesignResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public SmileDesignResponse get(Long id) {
		permissionService.require(Permission.SMILE_DESIGN_READ);
		return SmileDesignResponse.from(findOrThrow(id));
	}

	@Transactional
	public SmileDesignResponse create(SmileDesignRequest request) {
		permissionService.require(Permission.SMILE_DESIGN_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(request.patientId(), clinicId);
		validateDesignJson(request.designJson());
		if (request.scanId() != null) {
			scanService.requireOwnedScan(request.scanId(), request.patientId(), clinicId);
		}

		SmileDesign design = new SmileDesign();
		design.setClinicId(clinicId);
		design.setPatientId(request.patientId());
		design.setScanId(request.scanId());
		design.setName(request.name().trim());
		design.setStatus(SmileDesign.DRAFT);
		design.setDesignJson(request.designJson());
		design.setNotes(blankToNull(request.notes()));
		design.setVersion(1);
		return SmileDesignResponse.from(designRepository.save(design));
	}

	@Transactional
	public SmileDesignResponse update(Long id, SmileDesignRequest request) {
		permissionService.require(Permission.SMILE_DESIGN_WRITE);
		SmileDesign design = findOrThrow(id);
		Long clinicId = design.getClinicId();
		requirePatient(request.patientId(), clinicId);
		if (!design.getPatientId().equals(request.patientId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede cambiar el paciente del diseño");
		}
		validateDesignJson(request.designJson());
		if (request.scanId() != null) {
			scanService.requireOwnedScan(request.scanId(), request.patientId(), clinicId);
		}
		design.setScanId(request.scanId());
		design.setName(request.name().trim());
		design.setDesignJson(request.designJson());
		design.setNotes(blankToNull(request.notes()));
		design.setVersion(design.getVersion() + 1);
		return SmileDesignResponse.from(designRepository.save(design));
	}

	@Transactional
	public SmileDesignResponse uploadExport(Long id, MultipartFile file) {
		permissionService.require(Permission.SMILE_DESIGN_WRITE);
		SmileDesign design = findOrThrow(id);
		String previous = design.getExportRelativePath();
		StoredFile stored = fileStorage.save(
				design.getClinicId(),
				design.getPatientId(),
				"SMILE_EXPORT",
				file,
				StorageKind.DESIGN_EXPORT);
		design.setExportRelativePath(stored.relativePath());
		design.setExportFileName(stored.originalFileName());
		design.setExportContentType(stored.contentType());
		design.setExportSizeBytes(stored.sizeBytes());
		design.setStatus(SmileDesign.EXPORTED);
		design.setVersion(design.getVersion() + 1);
		SmileDesign saved = designRepository.save(design);
		if (previous != null && !previous.equals(stored.relativePath())) {
			fileStorage.delete(previous);
		}
		return SmileDesignResponse.from(saved);
	}

	@Transactional(readOnly = true)
	public FilePayload loadExport(Long id) {
		permissionService.require(Permission.SMILE_DESIGN_READ);
		SmileDesign design = findOrThrow(id);
		if (design.getExportRelativePath() == null || design.getExportRelativePath().isBlank()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El diseño aún no tiene exportación STL");
		}
		byte[] bytes = fileStorage.load(design.getExportRelativePath());
		String contentType = design.getExportContentType() == null ? "model/stl" : design.getExportContentType();
		String fileName = design.getExportFileName() == null ? "design.stl" : design.getExportFileName();
		return new FilePayload(bytes, contentType, fileName);
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.SMILE_DESIGN_DELETE);
		SmileDesign design = findOrThrow(id);
		String exportPath = design.getExportRelativePath();
		designRepository.delete(design);
		fileStorage.delete(exportPath);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> suggest(Long id, SmileSuggestRequest request) {
		permissionService.require(Permission.SMILE_DESIGN_READ);
		findOrThrow(id);
		String json = suggestionEngine.suggest(request);
		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
			return parsed;
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Sugerencia inválida");
		}
	}

	@Transactional(readOnly = true)
	public Map<String, Object> suggestForPatient(Long patientId, SmileSuggestRequest request) {
		permissionService.require(Permission.SMILE_DESIGN_READ);
		requirePatient(patientId, clinicAccess.requireClinicId());
		String json = suggestionEngine.suggest(request);
		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
			return parsed;
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Sugerencia inválida");
		}
	}

	private void validateDesignJson(String designJson) {
		if (designJson == null || designJson.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "designJson es obligatorio");
		}
		try {
			objectMapper.readTree(designJson);
		} catch (JsonProcessingException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "designJson no es JSON válido");
		}
	}

	private SmileDesign findOrThrow(Long id) {
		return designRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diseño no encontrado"));
	}

	private void requirePatient(Long patientId, Long clinicId) {
		patientRepository.findByIdAndClinicId(patientId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
	}

	private static String blankToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	public record FilePayload(byte[] bytes, String contentType, String fileName) {
	}
}
