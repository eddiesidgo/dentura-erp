package com.dentura.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dentura.api.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByUserName(String userName);

	Optional<User> findByEmail(String email);

	boolean existsByUserName(String userName);

	boolean existsByEmail(String email);

	List<User> findByClinicIdOrderByUserNameAsc(Long clinicId);
}
