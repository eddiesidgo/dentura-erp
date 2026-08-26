package com.dentura.api.auth.dto;

import java.util.List;

import com.dentura.api.domain.User;

public record UserDto(
		Long id,
		String userName,
		List<String> authority,
		String avatar,
		String email,
		Long clinicId) {

	public static UserDto from(User user, Long clinicId, List<String> authority) {
		return new UserDto(
				user.getId(),
				user.getUserName(),
				authority,
				user.getAvatar(),
				user.getEmail(),
				clinicId);
	}
}
