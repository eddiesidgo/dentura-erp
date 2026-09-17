package com.dentura.api.room;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.room.dto.RoomRequest;
import com.dentura.api.room.dto.RoomResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

	private final RoomService roomService;

	public RoomController(RoomService roomService) {
		this.roomService = roomService;
	}

	@GetMapping
	public List<RoomResponse> list(@RequestParam(name = "activeOnly", required = false) Boolean activeOnly) {
		return roomService.list(activeOnly);
	}

	@PostMapping
	public ResponseEntity<RoomResponse> create(@Valid @RequestBody RoomRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(roomService.create(request));
	}

	@PutMapping("/{id}")
	public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
		return roomService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		roomService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
