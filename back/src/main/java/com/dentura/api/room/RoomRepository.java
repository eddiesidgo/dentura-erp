package com.dentura.api.room;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {

	List<Room> findByClinicIdOrderByNameAsc(Long clinicId);

	List<Room> findByClinicIdAndActiveTrueOrderByNameAsc(Long clinicId);

	Optional<Room> findByIdAndClinicId(Long id, Long clinicId);

	Optional<Room> findFirstByClinicIdAndName(Long clinicId, String name);
}
