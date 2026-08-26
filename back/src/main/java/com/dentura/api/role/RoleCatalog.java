package com.dentura.api.role;

import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RoleCatalog {

	private final PermissionRepository permissionRepository;
	private final RoleRepository roleRepository;

	public RoleCatalog(PermissionRepository permissionRepository, RoleRepository roleRepository) {
		this.permissionRepository = permissionRepository;
		this.roleRepository = roleRepository;
	}

	@Transactional
	public void ensureCatalog() {
		ensurePermission(Permission.ROLES_MANAGE, "Asignar roles y permisos",
				"Permite crear roles y asignar permisos a usuarios de la misma clínica");
		ensurePermission(Permission.PATIENTS_READ, "Ver pacientes", "Consulta el padrón de pacientes");
		ensurePermission(Permission.PATIENTS_WRITE, "Editar pacientes", "Crea y actualiza fichas de pacientes");
		ensurePermission(Permission.PATIENTS_DELETE, "Eliminar pacientes", "Elimina fichas de pacientes");
		ensurePermission(Permission.AGENDA_READ, "Ver agenda", "Consulta el calendario de citas");
		ensurePermission(Permission.AGENDA_WRITE, "Editar agenda", "Crea y actualiza citas");
		ensurePermission(Permission.AGENDA_DELETE, "Eliminar citas", "Elimina citas del calendario");
	}

	@Transactional
	public void ensureClinicRoles(Long clinicId) {
		Role admin = roleRepository.findByClinicIdAndCode(clinicId, "administrador").orElseGet(() -> {
			Role role = new Role();
			role.setClinicId(clinicId);
			role.setCode("administrador");
			role.setName("Administrador");
			role.setDescription("Gestión completa de la clínica, incluida la asignación de permisos");
			role.setSystemRole(true);
			return role;
		});
		admin.setPermissions(new HashSet<>(permissionRepository.findAll()));
		roleRepository.save(admin);

		Role reception = roleRepository.findByClinicIdAndCode(clinicId, "recepcion").orElseGet(() -> {
			Role role = new Role();
			role.setClinicId(clinicId);
			role.setCode("recepcion");
			role.setName("Recepción");
			role.setDescription("Alta de pacientes y gestión de la agenda");
			role.setSystemRole(true);
			return role;
		});
		Set<Permission> receptionPerms = new HashSet<>(reception.getPermissions());
		permissionRepository.findByCode(Permission.PATIENTS_READ).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.PATIENTS_WRITE).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.AGENDA_READ).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.AGENDA_WRITE).ifPresent(receptionPerms::add);
		reception.setPermissions(receptionPerms);
		roleRepository.save(reception);
	}

	private void ensurePermission(String code, String name, String description) {
		if (permissionRepository.existsByCode(code)) {
			return;
		}
		Permission permission = new Permission();
		permission.setCode(code);
		permission.setName(name);
		permission.setDescription(description);
		permissionRepository.save(permission);
	}
}
