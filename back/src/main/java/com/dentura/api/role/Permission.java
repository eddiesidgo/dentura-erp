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
	public static final String PATIENTS_READ = "patients.read";
	public static final String PATIENTS_WRITE = "patients.write";
	public static final String PATIENTS_DELETE = "patients.delete";
	public static final String AGENDA_READ = "agenda.read";
	public static final String AGENDA_WRITE = "agenda.write";
	public static final String AGENDA_DELETE = "agenda.delete";

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
