package com.dentura.api.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.dentura.api.domain.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey secretKey;
	private final long expirationMs;

	public JwtService(
			@Value("${dentura.jwt.secret}") String secret,
			@Value("${dentura.jwt.expiration-ms}") long expirationMs) {
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMs = expirationMs;
	}

	public String generateToken(User user, Long clinicId) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + expirationMs);
		var builder = Jwts.builder()
				.subject(user.getUserName())
				.claim("uid", user.getId())
				.issuedAt(now)
				.expiration(expiry)
				.signWith(secretKey);
		if (clinicId != null) {
			builder.claim("cid", clinicId);
		}
		return builder.compact();
	}

	public Long extractClinicId(String token) {
		Object cid = parseClaims(token).get("cid");
		if (cid instanceof Number number) {
			return number.longValue();
		}
		return null;
	}

	public String extractUsername(String token) {
		return parseClaims(token).getSubject();
	}

	public boolean isTokenValid(String token, String expectedUsername) {
		try {
			Claims claims = parseClaims(token);
			String subject = claims.getSubject();
			Date expiration = claims.getExpiration();
			return subject.equals(expectedUsername) && expiration.after(new Date());
		}
		catch (Exception ex) {
			return false;
		}
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(secretKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}
