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
		ensurePermission(Permission.CATALOG_READ, "Ver catálogo", "Consulta el catálogo de tratamientos");
		ensurePermission(Permission.CATALOG_WRITE, "Editar catálogo", "Crea y actualiza tratamientos");
		ensurePermission(Permission.CATALOG_DELETE, "Eliminar tratamientos", "Elimina tratamientos del catálogo");
		ensurePermission(Permission.WORKS_READ, "Ver trabajos", "Consulta el plan de tratamientos del paciente");
		ensurePermission(Permission.WORKS_WRITE, "Editar trabajos", "Crea y actualiza trabajos del paciente");
		ensurePermission(Permission.WORKS_DELETE, "Eliminar trabajos", "Elimina trabajos del plan del paciente");
		ensurePermission(Permission.REPORTS_READ, "Ver reportes", "Consulta e imprime reportes y cotizaciones");
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
		permissionRepository.findByCode(Permission.CATALOG_READ).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.WORKS_READ).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.WORKS_WRITE).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.REPORTS_READ).ifPresent(receptionPerms::add);
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
