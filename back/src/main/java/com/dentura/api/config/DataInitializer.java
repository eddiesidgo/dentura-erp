package com.dentura.api.config;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.dentura.api.clinic.Clinic;
import com.dentura.api.clinic.ClinicRepository;
import com.dentura.api.clinic.ClinicService;
import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;
import com.dentura.api.role.RoleCatalog;

@Component
public class DataInitializer implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	private final UserRepository userRepository;
	private final ClinicRepository clinicRepository;
	private final PasswordEncoder passwordEncoder;
	private final RoleCatalog roleCatalog;

	@Value("${dentura.seed.admin-username}")
	private String adminUsername;

	@Value("${dentura.seed.admin-password}")
	private String adminPassword;

	@Value("${dentura.seed.admin-email}")
	private String adminEmail;

	public DataInitializer(
			UserRepository userRepository,
			ClinicRepository clinicRepository,
			PasswordEncoder passwordEncoder,
			RoleCatalog roleCatalog) {
		this.userRepository = userRepository;
		this.clinicRepository = clinicRepository;
		this.passwordEncoder = passwordEncoder;
		this.roleCatalog = roleCatalog;
	}

	@Override
	public void run(String... args) {
		roleCatalog.ensureCatalog();
		ensureDefaultClinic();
		clinicRepository.findAll().forEach(clinic -> roleCatalog.ensureClinicRoles(clinic.getId()));

		userRepository.findByUserName(adminUsername).ifPresentOrElse(this::ensureSeedSuperAdmin, this::createSeedAdmin);
	}

	private Clinic ensureDefaultClinic() {
		return clinicRepository.findByCode(ClinicService.DEFAULT_CODE).orElseGet(() -> {
			Clinic clinic = new Clinic();
			clinic.setCode(ClinicService.DEFAULT_CODE);
			clinic.setName("Dentura");
			Clinic saved = clinicRepository.save(clinic);
			log.info("Seeded default clinic '{}'", saved.getCode());
			return saved;
		});
	}

	private void createSeedAdmin() {
		User admin = new User();
		admin.setUserName(adminUsername);
		admin.setEmail(adminEmail);
		admin.setPasswordHash(passwordEncoder.encode(adminPassword));
		admin.setAvatar("/img/avatars/thumb-1.jpg");
		admin.setAuthorities(List.of("super_admin", "admin", "user"));
		admin.setClinicId(null);
		userRepository.save(admin);
		log.info("Seeded default super admin '{}'", adminUsername);
	}

	private void ensureSeedSuperAdmin(User existing) {
		List<String> authorities = new ArrayList<>(existing.getAuthorities());
		boolean changed = false;
		if (!authorities.contains("super_admin")) {
			authorities.add(0, "super_admin");
			existing.setAuthorities(authorities);
			changed = true;
		}
		if (existing.getClinicId() != null) {
			existing.setClinicId(null);
			changed = true;
		}
		if (changed) {
			userRepository.save(existing);
			log.info("Updated seed user '{}' to super_admin", adminUsername);
		}
	}
}
