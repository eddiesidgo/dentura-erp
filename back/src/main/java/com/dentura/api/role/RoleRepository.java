package com.dentura.api.role;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, Long> {

	@Query("""
			SELECT DISTINCT r FROM Role r
			LEFT JOIN FETCH r.permissions
			WHERE r.clinicId = :clinicId
			ORDER BY r.name ASC
			""")
	List<Role> findByClinicIdOrderByNameAsc(@Param("clinicId") Long clinicId);

	boolean existsByClinicId(Long clinicId);

	boolean existsByClinicIdAndCode(Long clinicId, String code);

	Optional<Role> findByIdAndClinicId(Long id, Long clinicId);

	Optional<Role> findByClinicIdAndCode(Long clinicId, String code);

	@Query("""
			SELECT DISTINCT p.code FROM com.dentura.api.domain.User u
			JOIN u.roles r
			JOIN r.permissions p
			WHERE u.id = :userId AND r.clinicId = :clinicId
			""")
	List<String> findPermissionCodes(@Param("userId") Long userId, @Param("clinicId") Long clinicId);
}
