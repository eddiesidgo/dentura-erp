package com.dentura.api.role;

import java.util.HashSet;
import java.util.List;
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
	}

	@Transactional
	public void ensureClinicRoles(Long clinicId) {
		if (roleRepository.existsByClinicId(clinicId)) {
			return;
		}
		Role admin = new Role();
		admin.setClinicId(clinicId);
		admin.setCode("administrador");
		admin.setName("Administrador");
		admin.setDescription("Gestión completa de la clínica, incluida la asignación de permisos");
		admin.setSystemRole(true);
		admin.setPermissions(new HashSet<>(permissionRepository.findAll()));
		roleRepository.save(admin);

		Set<Permission> receptionPerms = new HashSet<>();
		permissionRepository.findByCode(Permission.PATIENTS_READ).ifPresent(receptionPerms::add);
		permissionRepository.findByCode(Permission.PATIENTS_WRITE).ifPresent(receptionPerms::add);
		Role reception = new Role();
		reception.setClinicId(clinicId);
		reception.setCode("recepcion");
		reception.setName("Recepción");
		reception.setDescription("Alta y consulta de pacientes");
		reception.setSystemRole(true);
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
