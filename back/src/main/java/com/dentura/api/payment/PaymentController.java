package com.dentura.api.payment;

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

import com.dentura.api.payment.dto.PatientBalanceResponse;
import com.dentura.api.payment.dto.PaymentRequest;
import com.dentura.api.payment.dto.PaymentResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private final PaymentService paymentService;

	public PaymentController(PaymentService paymentService) {
		this.paymentService = paymentService;
	}

	@GetMapping
	public List<PaymentResponse> list(@RequestParam(required = false) Long patientId) {
		return paymentService.list(patientId);
	}

	@GetMapping("/balance")
	public PatientBalanceResponse balance(@RequestParam(required = false) Long patientId) {
		return paymentService.balance(patientId);
	}

	@GetMapping("/{id}")
	public PaymentResponse get(@PathVariable Long id) {
		return paymentService.get(id);
	}

	@PostMapping
	public ResponseEntity<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.create(request));
	}

	@PutMapping("/{id}")
	public PaymentResponse update(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
		return paymentService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		paymentService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
