package com.dentura.api.ledger;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "ledger_entries")
public class LedgerEntry {

	public static final String CHARGE = "CHARGE";
	public static final String PAYMENT = "PAYMENT";
	public static final String ADJUSTMENT = "ADJUSTMENT";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "clinic_id", nullable = false)
	private Long clinicId;

	@Column(name = "patient_id", nullable = false)
	private Long patientId;

	@Column(name = "work_id")
	private Long workId;

	@Column(nullable = false, length = 20)
	private String type;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(length = 255)
	private String description;

	@Column(name = "entry_date", nullable = false)
	private Instant entryDate;

	@Column(name = "payment_id")
	private Long paymentId;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (entryDate == null) {
			entryDate = createdAt;
		}
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

	public Long getWorkId() {
		return workId;
	}

	public void setWorkId(Long workId) {
		this.workId = workId;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Instant getEntryDate() {
		return entryDate;
	}

	public void setEntryDate(Instant entryDate) {
		this.entryDate = entryDate;
	}

	public Long getPaymentId() {
		return paymentId;
	}

	public void setPaymentId(Long paymentId) {
		this.paymentId = paymentId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
