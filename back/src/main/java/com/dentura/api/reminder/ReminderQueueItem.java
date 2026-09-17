package com.dentura.api.reminder;

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
@Table(name = "reminder_queue", uniqueConstraints = {
		@UniqueConstraint(columnNames = "appointment_id")
})
public class ReminderQueueItem {

	public static final String PENDING = "PENDING";
	public static final String SENT = "SENT";
	public static final String SKIPPED = "SKIPPED";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "clinic_id", nullable = false)
	private Long clinicId;

	@Column(name = "appointment_id", nullable = false)
	private Long appointmentId;

	@Column(name = "patient_id", nullable = false)
	private Long patientId;

	@Column(name = "phone_normalized", nullable = false, length = 32)
	private String phoneNormalized;

	@Column(name = "message_body", nullable = false, length = 2000)
	private String messageBody;

	@Column(name = "wa_me_url", nullable = false, length = 512)
	private String waMeUrl;

	@Column(nullable = false, length = 20)
	private String status = PENDING;

	@Column(name = "scheduled_for", nullable = false)
	private Instant scheduledFor;

	@Column(name = "sent_at")
	private Instant sentAt;

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

	public Long getClinicId() {
		return clinicId;
	}

	public void setClinicId(Long clinicId) {
		this.clinicId = clinicId;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public void setAppointmentId(Long appointmentId) {
		this.appointmentId = appointmentId;
	}

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public String getPhoneNormalized() {
		return phoneNormalized;
	}

	public void setPhoneNormalized(String phoneNormalized) {
		this.phoneNormalized = phoneNormalized;
	}

	public String getMessageBody() {
		return messageBody;
	}

	public void setMessageBody(String messageBody) {
		this.messageBody = messageBody;
	}

	public String getWaMeUrl() {
		return waMeUrl;
	}

	public void setWaMeUrl(String waMeUrl) {
		this.waMeUrl = waMeUrl;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getScheduledFor() {
		return scheduledFor;
	}

	public void setScheduledFor(Instant scheduledFor) {
		this.scheduledFor = scheduledFor;
	}

	public Instant getSentAt() {
		return sentAt;
	}

	public void setSentAt(Instant sentAt) {
		this.sentAt = sentAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
