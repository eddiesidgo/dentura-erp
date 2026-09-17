package com.dentura.api;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DenturaApiApplication {

	public static void main(String[] args) throws Exception {
		Path dataDir = Path.of("data");
		if (!Files.exists(dataDir)) {
			Files.createDirectories(dataDir);
		}
		SpringApplication.run(DenturaApiApplication.class, args);
	}
}
