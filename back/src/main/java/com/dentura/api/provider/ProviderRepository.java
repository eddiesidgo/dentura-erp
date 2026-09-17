package com.dentura.api.provider;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<Provider, Long> {

	List<Provider> findByClinicIdOrderByNameAsc(Long clinicId);

	List<Provider> findByClinicIdAndActiveTrueOrderByNameAsc(Long clinicId);

	Optional<Provider> findByIdAndClinicId(Long id, Long clinicId);

	Optional<Provider> findFirstByClinicIdAndName(Long clinicId, String name);
}
