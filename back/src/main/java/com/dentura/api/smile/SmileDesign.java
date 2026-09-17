package com.dentura.api.smile;

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
@Table(name = "smile_designs")
public class SmileDesign {

	public static final String DRAFT = "DRAFT";
	public static final String EXPORTED = "EXPORTED";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "clinic_id", nullable = false)
	private Long clinicId;

	@Column(name = "patient_id", nullable = false)
	private Long patientId;

	@Column(name = "scan_id")
	private Long scanId;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(nullable = false, length = 20)
	private String status = DRAFT;

	@Column(name = "design_json", nullable = false, columnDefinition = "TEXT")
	private String designJson;

	@Column(name = "export_relative_path", length = 500)
	private String exportRelativePath;

	@Column(name = "export_file_name", length = 255)
	private String exportFileName;

	@Column(name = "export_content_type", length = 100)
	private String exportContentType;

	@Column(name = "export_size_bytes")
	private Long exportSizeBytes;

	@Column(nullable = false)
	private int version = 1;

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

	public Long getScanId() {
		return scanId;
	}

	public void setScanId(Long scanId) {
		this.scanId = scanId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getDesignJson() {
		return designJson;
	}

	public void setDesignJson(String designJson) {
		this.designJson = designJson;
	}

	public String getExportRelativePath() {
		return exportRelativePath;
	}

	public void setExportRelativePath(String exportRelativePath) {
		this.exportRelativePath = exportRelativePath;
	}

	public String getExportFileName() {
		return exportFileName;
	}

	public void setExportFileName(String exportFileName) {
		this.exportFileName = exportFileName;
	}

	public String getExportContentType() {
		return exportContentType;
	}

	public void setExportContentType(String exportContentType) {
		this.exportContentType = exportContentType;
	}

	public Long getExportSizeBytes() {
		return exportSizeBytes;
	}

	public void setExportSizeBytes(Long exportSizeBytes) {
		this.exportSizeBytes = exportSizeBytes;
	}

	public int getVersion() {
		return version;
	}

	public void setVersion(int version) {
		this.version = version;
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
