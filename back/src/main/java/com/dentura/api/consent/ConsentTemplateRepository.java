package com.dentura.api.consent;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsentTemplateRepository extends JpaRepository<ConsentTemplate, Long> {

	List<ConsentTemplate> findByClinicIdOrderByTitleAsc(Long clinicId);

	List<ConsentTemplate> findByClinicIdAndActiveTrueOrderByTitleAsc(Long clinicId);

	Optional<ConsentTemplate> findByIdAndClinicId(Long id, Long clinicId);

	Optional<ConsentTemplate> findFirstByClinicIdAndTitle(Long clinicId, String title);
}
