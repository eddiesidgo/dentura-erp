package com.dentura.api.role;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.role.dto.ClinicUserRolesResponse;
import com.dentura.api.role.dto.CreateClinicUserRequest;
import com.dentura.api.role.dto.UpdateClinicUserRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinic-users")
public class ClinicUserController {

	private final ClinicUserService clinicUserService;

	public ClinicUserController(ClinicUserService clinicUserService) {
		this.clinicUserService = clinicUserService;
	}

	@PostMapping
	public ResponseEntity<ClinicUserRolesResponse> create(@Valid @RequestBody CreateClinicUserRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(clinicUserService.create(request));
	}

	@PutMapping("/{id}")
	public ClinicUserRolesResponse update(
			@PathVariable Long id,
			@Valid @RequestBody UpdateClinicUserRequest request) {
		return clinicUserService.update(id, request);
	}
}
