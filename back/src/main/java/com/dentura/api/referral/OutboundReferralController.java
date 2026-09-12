package com.dentura.api.referral;

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

import com.dentura.api.referral.dto.OutboundReferralRequest;
import com.dentura.api.referral.dto.OutboundReferralResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/outbound-referrals")
public class OutboundReferralController {

	private final OutboundReferralService referralService;

	public OutboundReferralController(OutboundReferralService referralService) {
		this.referralService = referralService;
	}

	@GetMapping
	public List<OutboundReferralResponse> list(@RequestParam(required = false) Long patientId) {
		return referralService.list(patientId);
	}

	@GetMapping("/{id}")
	public OutboundReferralResponse get(@PathVariable Long id) {
		return referralService.get(id);
	}

	@PostMapping
	public ResponseEntity<OutboundReferralResponse> create(@Valid @RequestBody OutboundReferralRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(referralService.create(request));
	}

	@PutMapping("/{id}")
	public OutboundReferralResponse update(
			@PathVariable Long id,
			@Valid @RequestBody OutboundReferralRequest request) {
		return referralService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		referralService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
