package com.dentura.api.clinic;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRepository extends JpaRepository<Clinic, Long> {

	Optional<Clinic> findByCode(String code);

	boolean existsByCode(String code);

	List<Clinic> findAllByActiveTrueOrderByNameAsc();
}
