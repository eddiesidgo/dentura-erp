package com.dentura.api.role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
public class Permission {

	public static final String ROLES_MANAGE = "roles.manage";
	public static final String CLINIC_MANAGE = "clinic.manage";
	public static final String AUDIT_READ = "audit.read";
	public static final String PATIENTS_READ = "patients.read";
	public static final String PATIENTS_WRITE = "patients.write";
	public static final String PATIENTS_DELETE = "patients.delete";
	public static final String AGENDA_READ = "agenda.read";
	public static final String AGENDA_WRITE = "agenda.write";
	public static final String AGENDA_DELETE = "agenda.delete";
	public static final String CATALOG_READ = "catalog.read";
	public static final String CATALOG_WRITE = "catalog.write";
	public static final String CATALOG_DELETE = "catalog.delete";
	public static final String WORKS_READ = "works.read";
	public static final String WORKS_WRITE = "works.write";
	public static final String WORKS_DELETE = "works.delete";
	public static final String REPORTS_READ = "reports.read";
	public static final String ODONTOGRAM_READ = "odontogram.read";
	public static final String ODONTOGRAM_WRITE = "odontogram.write";
	public static final String ODONTOGRAM_DELETE = "odontogram.delete";
	public static final String PAYMENTS_READ = "payments.read";
	public static final String PAYMENTS_WRITE = "payments.write";
	public static final String PAYMENTS_DELETE = "payments.delete";
	public static final String PHOTOS_READ = "photos.read";
	public static final String PHOTOS_WRITE = "photos.write";
	public static final String PHOTOS_DELETE = "photos.delete";
	public static final String SCANS_READ = "scans.read";
	public static final String SCANS_WRITE = "scans.write";
	public static final String SCANS_DELETE = "scans.delete";
	public static final String SMILE_DESIGN_READ = "smiledesign.read";
	public static final String SMILE_DESIGN_WRITE = "smiledesign.write";
	public static final String SMILE_DESIGN_DELETE = "smiledesign.delete";
	public static final String PRESCRIPTIONS_READ = "prescriptions.read";
	public static final String PRESCRIPTIONS_WRITE = "prescriptions.write";
	public static final String PRESCRIPTIONS_DELETE = "prescriptions.delete";
	public static final String REFERRALS_READ = "referrals.read";
	public static final String REFERRALS_WRITE = "referrals.write";
	public static final String REFERRALS_DELETE = "referrals.delete";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 80)
	private String code;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(length = 255)
	private String description;

	public Long getId() {
		return id;
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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}
}
