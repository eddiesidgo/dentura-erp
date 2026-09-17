package com.dentura.api.appointment;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.appointment.dto.AppointmentRequest;
import com.dentura.api.appointment.dto.AppointmentResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

	private final AppointmentService appointmentService;

	public AppointmentController(AppointmentService appointmentService) {
		this.appointmentService = appointmentService;
	}

	@GetMapping
	public List<AppointmentResponse> list(
			@RequestParam Instant from,
			@RequestParam Instant to,
			@RequestParam(required = false) Long providerId,
			@RequestParam(required = false) Long roomId) {
		return appointmentService.list(from, to, providerId, roomId);
	}

	@GetMapping("/{id}")
	public AppointmentResponse get(@PathVariable Long id) {
		return appointmentService.get(id);
	}

	@PostMapping
	public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
	}

	@PutMapping("/{id}")
	public AppointmentResponse update(@PathVariable Long id, @Valid @RequestBody AppointmentRequest request) {
		return appointmentService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		appointmentService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
