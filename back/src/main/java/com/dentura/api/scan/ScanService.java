package com.dentura.api.scan;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.patient.PatientRepository;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.scan.dto.ScanResponse;
import com.dentura.api.storage.PatientFileStorage;
import com.dentura.api.storage.PatientFileStorage.StoredFile;
import com.dentura.api.storage.StorageKind;

@Service
public class ScanService {

	private static final Set<String> ARCHES = Set.of(
			PatientScan.UPPER,
			PatientScan.LOWER,
			PatientScan.FULL_ARCH,
			PatientScan.OTHER);

	private final PatientScanRepository scanRepository;
	private final PatientRepository patientRepository;
	private final PatientFileStorage fileStorage;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public ScanService(
			PatientScanRepository scanRepository,
			PatientRepository patientRepository,
			PatientFileStorage fileStorage,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.scanRepository = scanRepository;
		this.patientRepository = patientRepository;
		this.fileStorage = fileStorage;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<ScanResponse> list(Long patientId, String arch) {
		permissionService.require(Permission.SCANS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		List<PatientScan> scans;
		if (arch == null || arch.isBlank()) {
			scans = scanRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId);
		} else {
			scans = scanRepository.findByClinicIdAndPatientIdAndArchOrderByCreatedAtDesc(
					clinicId, patientId, requireArch(arch));
		}
		return scans.stream().map(ScanResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public ScanResponse get(Long id) {
		permissionService.require(Permission.SCANS_READ);
		return ScanResponse.from(findOrThrow(id));
	}

	@Transactional(readOnly = true)
	public FilePayload loadFile(Long id) {
		permissionService.require(Permission.SCANS_READ);
		PatientScan scan = findOrThrow(id);
		byte[] bytes = fileStorage.load(scan.getRelativePath());
		return new FilePayload(bytes, scan.getContentType(), scan.getFileName());
	}

	@Transactional
	public ScanResponse create(Long patientId, MultipartFile file, String arch, String caption) {
		permissionService.require(Permission.SCANS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		String normalizedArch = requireArch(arch);
		StoredFile stored = fileStorage.save(clinicId, patientId, "SCANS_" + normalizedArch, file, StorageKind.MESH);

		PatientScan scan = new PatientScan();
		scan.setClinicId(clinicId);
		scan.setPatientId(patientId);
		scan.setArch(normalizedArch);
		scan.setFileName(stored.originalFileName());
		scan.setContentType(stored.contentType());
		scan.setSizeBytes(stored.sizeBytes());
		scan.setRelativePath(stored.relativePath());
		scan.setCaption(blankToNull(caption));
		return ScanResponse.from(scanRepository.save(scan));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.SCANS_DELETE);
		PatientScan scan = findOrThrow(id);
		String relativePath = scan.getRelativePath();
		scanRepository.delete(scan);
		fileStorage.delete(relativePath);
	}

	public PatientScan requireOwnedScan(Long scanId, Long patientId, Long clinicId) {
		PatientScan scan = scanRepository.findByIdAndClinicId(scanId, clinicId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scan no encontrado"));
		if (!scan.getPatientId().equals(patientId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El scan no pertenece al paciente");
		}
		return scan;
	}

	private String requireArch(String arch) {
		if (arch == null || arch.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El arco es obligatorio");
		}
		String value = arch.trim().toUpperCase(Locale.ROOT);
		if (!ARCHES.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arco de scan inválido");
		}
		return value;
	}

	private PatientScan findOrThrow(Long id) {
		return scanRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scan no encontrado"));
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
