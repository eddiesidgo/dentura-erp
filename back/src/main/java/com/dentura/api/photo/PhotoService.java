package com.dentura.api.photo;

import java.time.Instant;
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
import com.dentura.api.photo.dto.PhotoResponse;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.storage.PatientFileStorage;
import com.dentura.api.storage.PatientFileStorage.StoredFile;

@Service
public class PhotoService {

	private static final Set<String> CATEGORIES = Set.of(
			PatientPhoto.CLINICAL,
			PatientPhoto.RVG,
			PatientPhoto.BEFORE_AFTER,
			PatientPhoto.OTHER);

	private final PatientPhotoRepository photoRepository;
	private final PatientRepository patientRepository;
	private final PatientFileStorage fileStorage;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public PhotoService(
			PatientPhotoRepository photoRepository,
			PatientRepository patientRepository,
			PatientFileStorage fileStorage,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.photoRepository = photoRepository;
		this.patientRepository = patientRepository;
		this.fileStorage = fileStorage;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<PhotoResponse> list(Long patientId, String category) {
		permissionService.require(Permission.PHOTOS_READ);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		List<PatientPhoto> photos;
		if (category == null || category.isBlank()) {
			photos = photoRepository.findByClinicIdAndPatientIdOrderByCreatedAtDesc(clinicId, patientId);
		} else {
			String normalized = requireCategory(category);
			photos = photoRepository.findByClinicIdAndPatientIdAndCategoryOrderByCreatedAtDesc(
					clinicId, patientId, normalized);
		}
		return photos.stream().map(PhotoResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public PhotoResponse get(Long id) {
		permissionService.require(Permission.PHOTOS_READ);
		return PhotoResponse.from(findOrThrow(id));
	}

	@Transactional(readOnly = true)
	public FilePayload loadFile(Long id) {
		permissionService.require(Permission.PHOTOS_READ);
		PatientPhoto photo = findOrThrow(id);
		byte[] bytes = fileStorage.load(photo.getRelativePath());
		return new FilePayload(bytes, photo.getContentType(), photo.getFileName());
	}

	@Transactional
	public PhotoResponse create(Long patientId, MultipartFile file, String category, String caption, Instant takenAt) {
		permissionService.require(Permission.PHOTOS_WRITE);
		Long clinicId = clinicAccess.requireClinicId();
		requirePatient(patientId, clinicId);
		String normalizedCategory = requireCategory(category);
		StoredFile stored = fileStorage.save(clinicId, patientId, normalizedCategory, file);

		PatientPhoto photo = new PatientPhoto();
		photo.setClinicId(clinicId);
		photo.setPatientId(patientId);
		photo.setCategory(normalizedCategory);
		photo.setFileName(stored.originalFileName());
		photo.setContentType(stored.contentType());
		photo.setSizeBytes(stored.sizeBytes());
		photo.setRelativePath(stored.relativePath());
		photo.setCaption(blankToNull(caption));
		photo.setTakenAt(takenAt);
		return PhotoResponse.from(photoRepository.save(photo));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.PHOTOS_DELETE);
		PatientPhoto photo = findOrThrow(id);
		String relativePath = photo.getRelativePath();
		photoRepository.delete(photo);
		fileStorage.delete(relativePath);
	}

	private String requireCategory(String category) {
		if (category == null || category.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria");
		}
		String value = category.trim().toUpperCase(Locale.ROOT);
		if (!CATEGORIES.contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoría de foto inválida");
		}
		return value;
	}

	private PatientPhoto findOrThrow(Long id) {
		return photoRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto no encontrada"));
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
