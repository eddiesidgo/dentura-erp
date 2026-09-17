package com.dentura.api.periodontogram;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "periodontogram_entries")
public class PeriodontogramEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "clinic_id", nullable = false)
	private Long clinicId;

	@Column(name = "patient_id", nullable = false)
	private Long patientId;

	@Column(nullable = false, length = 8)
	private String tooth;

	@Column(name = "values_json", length = 4000)
	private String valuesJson;

	@Column(length = 2000)
	private String notes;

	@Column(name = "recorded_at", nullable = false)
	private Instant recordedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
		if (recordedAt == null) {
			recordedAt = now;
		}
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

	public Long getPatientId() {
		return patientId;
	}

	public void setPatientId(Long patientId) {
		this.patientId = patientId;
	}

	public String getTooth() {
		return tooth;
	}

	public void setTooth(String tooth) {
		this.tooth = tooth;
	}

	public String getValuesJson() {
		return valuesJson;
	}

	public void setValuesJson(String valuesJson) {
		this.valuesJson = valuesJson;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getRecordedAt() {
		return recordedAt;
	}

	public void setRecordedAt(Instant recordedAt) {
		this.recordedAt = recordedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
