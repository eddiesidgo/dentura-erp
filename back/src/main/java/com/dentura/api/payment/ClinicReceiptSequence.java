package com.dentura.api.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "clinic_receipt_sequences")
public class ClinicReceiptSequence {

	@Id
	@Column(name = "clinic_id")
	private Long clinicId;

	@Column(name = "next_number", nullable = false)
	private int nextNumber = 1;

	public Long getClinicId() {
		return clinicId;
	}

	public void setClinicId(Long clinicId) {
		this.clinicId = clinicId;
	}

	public int getNextNumber() {
		return nextNumber;
	}

	public void setNextNumber(int nextNumber) {
		this.nextNumber = nextNumber;
	}
}
