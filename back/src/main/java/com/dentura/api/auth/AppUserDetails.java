package com.dentura.api.auth;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.dentura.api.domain.User;

public class AppUserDetails implements UserDetails {

	private final User user;
	private final Long activeClinicId;

	public AppUserDetails(User user) {
		this(user, user.getClinicId());
	}

	public AppUserDetails(User user, Long activeClinicId) {
		this.user = user;
		this.activeClinicId = activeClinicId;
	}

	public User getUser() {
		return user;
	}

	public Long getActiveClinicId() {
		return activeClinicId;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return user.getAuthorities().stream()
				.map(SimpleGrantedAuthority::new)
				.toList();
	}

	@Override
	public String getPassword() {
		return user.getPasswordHash();
	}

	@Override
	public String getUsername() {
		return user.getUserName();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}

	public static List<String> authorityNames(User user) {
		return user.getAuthorities();
	}
}
