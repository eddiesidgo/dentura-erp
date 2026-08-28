package com.dentura.api.clinic;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.dentura.api.auth.dto.AuthResponse;
import com.dentura.api.clinic.dto.ClinicIdentityResponse;
import com.dentura.api.clinic.dto.CreateClinicRequest;
import com.dentura.api.clinic.dto.UpdateClinicRequest;

import jakarta.validation.Valid;

@RestController
public class ClinicController {

	private final ClinicService clinicService;

	public ClinicController(ClinicService clinicService) {
		this.clinicService = clinicService;
	}

	@GetMapping("/api/clinic-identity")
	public ClinicIdentityResponse publicIdentity() {
		return clinicService.publicIdentity();
	}

	@GetMapping("/api/clinics")
	public List<ClinicIdentityResponse> list() {
		return clinicService.list();
	}

	@GetMapping("/api/clinics/current")
	public ClinicIdentityResponse current() {
		return clinicService.current();
	}

	@PutMapping("/api/clinics/current")
	public ClinicIdentityResponse updateCurrent(@Valid @RequestBody UpdateClinicRequest request) {
		return clinicService.updateCurrent(request);
	}

	@PostMapping("/api/clinics/current/logo")
	public ClinicIdentityResponse uploadLogo(@RequestParam("file") MultipartFile file) {
		return clinicService.uploadLogo(file);
	}

	@GetMapping("/api/clinics/{id}/logo")
	public ResponseEntity<byte[]> logo(@PathVariable Long id) {
		return clinicService.serveLogo(id);
	}

	@PostMapping("/api/clinics")
	public ResponseEntity<ClinicIdentityResponse> create(@Valid @RequestBody CreateClinicRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(clinicService.create(request));
	}

	@PostMapping("/api/clinics/{id}/switch")
	public AuthResponse switchClinic(@PathVariable Long id) {
		return clinicService.switchClinic(id);
	}
}
