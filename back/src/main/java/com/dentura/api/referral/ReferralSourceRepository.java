package com.dentura.api.referral;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralSourceRepository extends JpaRepository<ReferralSource, Long> {

	List<ReferralSource> findByClinicIdOrderByNameAsc(Long clinicId);

	Optional<ReferralSource> findByIdAndClinicId(Long id, Long clinicId);
}
