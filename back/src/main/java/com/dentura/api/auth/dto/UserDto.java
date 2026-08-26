package com.dentura.api.auth.dto;

import java.util.List;

import com.dentura.api.domain.User;

public record UserDto(
		String userName,
		List<String> authority,
		String avatar,
		String email,
		Long clinicId) {

	public static UserDto from(User user, Long clinicId) {
		return new UserDto(
				user.getUserName(),
				user.getAuthorities(),
				user.getAvatar(),
				user.getEmail(),
				clinicId);
	}
}
