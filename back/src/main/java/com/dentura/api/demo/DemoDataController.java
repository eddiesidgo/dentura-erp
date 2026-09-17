package com.dentura.api.demo;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoDataController {

	private final DemoDataSeeder demoDataSeeder;

	public DemoDataController(DemoDataSeeder demoDataSeeder) {
		this.demoDataSeeder = demoDataSeeder;
	}

	@GetMapping("/status")
	public Map<String, Object> status() {
		return Map.of(
				"seedEnabled", demoDataSeeder.isEnabled(),
				"hint", demoDataSeeder.isEnabled()
						? "POST /api/demo/seed como super_admin (pacientes DEMO + fotos/scans/smile)"
						: "Arranca el API con DENTURA_DEMO_SEED_ENABLED=true para habilitar el seed manual");
	}

	@PostMapping("/seed")
	public ResponseEntity<DemoDataSeeder.DemoSeedResult> seed() {
		return ResponseEntity.ok(demoDataSeeder.seed());
	}
}
