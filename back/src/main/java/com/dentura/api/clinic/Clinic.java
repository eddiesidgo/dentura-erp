package com.dentura.api.clinic;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "clinics", uniqueConstraints = {
		@UniqueConstraint(columnNames = "code"),
})
public class Clinic {

	public static final String PROVIDER_MODE_SINGLE = "SINGLE";
	public static final String PROVIDER_MODE_MULTI = "MULTI";
	public static final String ROOM_MODE_OFF = "OFF";
	public static final String ROOM_MODE_OPTIONAL = "OPTIONAL";
	public static final String ROOM_MODE_REQUIRED = "REQUIRED";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 40)
	private String code;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(name = "logo_url", length = 512)
	private String logoUrl;

	@Column(length = 40)
	private String phone;

	@Column(length = 255)
	private String email;

	@Column(length = 255)
	private String address;

	@Column(length = 120)
	private String city;

	@Column(length = 120)
	private String department;

	@Column(length = 30)
	private String nit;

	@Column(name = "theme_mode", nullable = false, length = 16)
	private String themeMode = "light";

	@Column(name = "theme_color", nullable = false, length = 32)
	private String themeColor = "indigo";

	@Column(name = "primary_color_level", nullable = false)
	private int primaryColorLevel = 600;

	@Column(name = "nav_mode", nullable = false, length = 32)
	private String navMode = "transparent";

	@Column(name = "layout_type", nullable = false, length = 32)
	private String layoutType = "modern";

	@Column(nullable = false, length = 8)
	private String direction = "ltr";

	@Column(nullable = false)
	private boolean active = true;

	@Column(name = "reminder_hours_before", nullable = false)
	private int reminderHoursBefore = 24;

	@Column(name = "reminder_message_template", length = 2000)
	private String reminderMessageTemplate =
			"Hola {patientName}, le recordamos su cita el {date} a las {time} en {clinicName}. Confirme su asistencia.";

	@Column(name = "reminder_default_country_code", nullable = false, length = 8)
	private String reminderDefaultCountryCode = "503";

	@Column(name = "provider_mode", nullable = false, length = 16)
	private String providerMode = PROVIDER_MODE_MULTI;

	@Column(name = "room_mode", nullable = false, length = 16)
	private String roomMode = ROOM_MODE_OPTIONAL;

	@Column(name = "referrals_inbound_enabled", nullable = false)
	private boolean referralsInboundEnabled = true;

	@Column(name = "referrals_outbound_enabled", nullable = false)
	private boolean referralsOutboundEnabled = true;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getLogoUrl() {
		return logoUrl;
	}

	public void setLogoUrl(String logoUrl) {
		this.logoUrl = logoUrl;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public String getNit() {
		return nit;
	}

	public void setNit(String nit) {
		this.nit = nit;
	}

	public String getThemeMode() {
		return themeMode;
	}

	public void setThemeMode(String themeMode) {
		this.themeMode = themeMode;
	}

	public String getThemeColor() {
		return themeColor;
	}

	public void setThemeColor(String themeColor) {
		this.themeColor = themeColor;
	}

	public int getPrimaryColorLevel() {
		return primaryColorLevel;
	}

	public void setPrimaryColorLevel(int primaryColorLevel) {
		this.primaryColorLevel = primaryColorLevel;
	}

	public String getNavMode() {
		return navMode;
	}

	public void setNavMode(String navMode) {
		this.navMode = navMode;
	}

	public String getLayoutType() {
		return layoutType;
	}

	public void setLayoutType(String layoutType) {
		this.layoutType = layoutType;
	}

	public String getDirection() {
		return direction;
	}

	public void setDirection(String direction) {
		this.direction = direction;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public int getReminderHoursBefore() {
		return reminderHoursBefore;
	}

	public void setReminderHoursBefore(int reminderHoursBefore) {
		this.reminderHoursBefore = reminderHoursBefore;
	}

	public String getReminderMessageTemplate() {
		return reminderMessageTemplate;
	}

	public void setReminderMessageTemplate(String reminderMessageTemplate) {
		this.reminderMessageTemplate = reminderMessageTemplate;
	}

	public String getReminderDefaultCountryCode() {
		return reminderDefaultCountryCode;
	}

	public void setReminderDefaultCountryCode(String reminderDefaultCountryCode) {
		this.reminderDefaultCountryCode = reminderDefaultCountryCode;
	}

	public String getProviderMode() {
		return providerMode;
	}

	public void setProviderMode(String providerMode) {
		this.providerMode = providerMode;
	}

	public String getRoomMode() {
		return roomMode;
	}

	public void setRoomMode(String roomMode) {
		this.roomMode = roomMode;
	}

	public boolean isReferralsInboundEnabled() {
		return referralsInboundEnabled;
	}

	public void setReferralsInboundEnabled(boolean referralsInboundEnabled) {
		this.referralsInboundEnabled = referralsInboundEnabled;
	}

	public boolean isReferralsOutboundEnabled() {
		return referralsOutboundEnabled;
	}

	public void setReferralsOutboundEnabled(boolean referralsOutboundEnabled) {
		this.referralsOutboundEnabled = referralsOutboundEnabled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
