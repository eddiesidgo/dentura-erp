package com.dentura.api.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.dentura.api.domain.User;
import com.dentura.api.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${dentura.seed.admin-username}")
	private String adminUsername;

	@Value("${dentura.seed.admin-password}")
	private String adminPassword;

	@Value("${dentura.seed.admin-email}")
	private String adminEmail;

	public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(String... args) {
		if (userRepository.existsByUserName(adminUsername)) {
			return;
		}

		User admin = new User();
		admin.setUserName(adminUsername);
		admin.setEmail(adminEmail);
		admin.setPasswordHash(passwordEncoder.encode(adminPassword));
		admin.setAvatar("/img/avatars/thumb-1.jpg");
		admin.setAuthorities(List.of("admin", "user"));

		userRepository.save(admin);
		log.info("Seeded default admin user '{}'", adminUsername);
	}
}
