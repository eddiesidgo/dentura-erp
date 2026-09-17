package com.dentura.api.ledger;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.ledger.dto.LedgerEntryResponse;
import com.dentura.api.ledger.dto.LedgerManualRequest;
import com.dentura.api.ledger.dto.LedgerStatementResponse;
import com.dentura.api.ledger.dto.MorosoResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

	private final LedgerService ledgerService;

	public LedgerController(LedgerService ledgerService) {
		this.ledgerService = ledgerService;
	}

	@GetMapping
	public List<LedgerEntryResponse> list(@RequestParam Long patientId) {
		return ledgerService.list(patientId);
	}

	@GetMapping("/statement")
	public LedgerStatementResponse statement(@RequestParam Long patientId) {
		return ledgerService.statement(patientId);
	}

	@GetMapping("/morosos")
	public List<MorosoResponse> morosos() {
		return ledgerService.morosos();
	}

	@PostMapping
	public ResponseEntity<LedgerEntryResponse> create(@Valid @RequestBody LedgerManualRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(ledgerService.createManual(request));
	}
}
