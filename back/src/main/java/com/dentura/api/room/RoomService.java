package com.dentura.api.room;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dentura.api.clinic.ClinicAccess;
import com.dentura.api.role.Permission;
import com.dentura.api.role.PermissionService;
import com.dentura.api.room.dto.RoomRequest;
import com.dentura.api.room.dto.RoomResponse;

@Service
public class RoomService {

	private final RoomRepository roomRepository;
	private final ClinicAccess clinicAccess;
	private final PermissionService permissionService;

	public RoomService(
			RoomRepository roomRepository,
			ClinicAccess clinicAccess,
			PermissionService permissionService) {
		this.roomRepository = roomRepository;
		this.clinicAccess = clinicAccess;
		this.permissionService = permissionService;
	}

	@Transactional(readOnly = true)
	public List<RoomResponse> list(Boolean activeOnly) {
		permissionService.require(Permission.AGENDA_READ);
		Long clinicId = clinicAccess.requireClinicId();
		List<Room> rooms = Boolean.TRUE.equals(activeOnly)
				? roomRepository.findByClinicIdAndActiveTrueOrderByNameAsc(clinicId)
				: roomRepository.findByClinicIdOrderByNameAsc(clinicId);
		return rooms.stream().map(RoomResponse::from).toList();
	}

	@Transactional
	public RoomResponse create(RoomRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		Room room = new Room();
		room.setClinicId(clinicAccess.requireClinicId());
		apply(room, request);
		return RoomResponse.from(roomRepository.save(room));
	}

	@Transactional
	public RoomResponse update(Long id, RoomRequest request) {
		permissionService.require(Permission.AGENDA_WRITE);
		Room room = findOrThrow(id);
		apply(room, request);
		return RoomResponse.from(roomRepository.save(room));
	}

	@Transactional
	public void delete(Long id) {
		permissionService.require(Permission.AGENDA_WRITE);
		roomRepository.delete(findOrThrow(id));
	}

	Room findOrThrow(Long id) {
		return roomRepository.findByIdAndClinicId(id, clinicAccess.requireClinicId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sala no encontrada"));
	}

	private void apply(Room room, RoomRequest request) {
		room.setName(request.name());
		if (request.active() != null) {
			room.setActive(request.active());
		}
	}
}
