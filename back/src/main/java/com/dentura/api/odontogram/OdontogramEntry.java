package com.dentura.api.odontogram;

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
@Table(name = "odontogram_entries")
public class OdontogramEntry {

	public static final String CARIES = "CARIES";
	public static final String FILLING = "FILLING";
	public static final String MISSING = "MISSING";
	public static final String CROWN = "CROWN";
	public static final String ENDO = "ENDO";
	public static final String IMPLANT = "IMPLANT";
	public static final String EXTRACTION_PLANNED = "EXTRACTION_PLANNED";
	public static final String OTHER = "OTHER";

	public static final String EXISTING = "EXISTING";
	public static final String PLANNED = "PLANNED";
	public static final String COMPLETED = "COMPLETED";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "clinic_id", nullable = false)
	private Long clinicId;

	@Column(name = "patient_id", nullable = false)
	private Long patientId;

	@Column(nullable = false, length = 10)
	private String tooth;

	@Column(length = 20)
	private String surfaces;

	@Column(nullable = false, length = 40)
	private String condition;

	@Column(nullable = false, length = 20)
	private String status = EXISTING;

	@Column(name = "work_id")
	private Long workId;

	@Column(columnDefinition = "TEXT")
	private String notes;

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

	public String getSurfaces() {
		return surfaces;
	}

	public void setSurfaces(String surfaces) {
		this.surfaces = surfaces;
	}

	public String getCondition() {
		return condition;
	}

	public void setCondition(String condition) {
		this.condition = condition;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Long getWorkId() {
		return workId;
	}

	public void setWorkId(Long workId) {
		this.workId = workId;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
