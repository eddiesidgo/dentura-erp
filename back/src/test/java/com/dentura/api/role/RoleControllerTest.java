package com.dentura.api.role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RoleControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void catalogRequiresAuth() throws Exception {
		mockMvc.perform(get("/api/permissions"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void staffWithoutRolesManageCannotListRoles() throws Exception {
		signUp("staff-roles-1", "staff-roles-1@dentura.local");
		String staffToken = bearer("staff-roles-1");

		mockMvc.perform(get("/api/roles").header("Authorization", staffToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void superAdminCanListPermissionsIncludingAssign() throws Exception {
		mockMvc.perform(get("/api/permissions").header("Authorization", adminBearer()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.code=='roles.manage')].name").isNotEmpty())
				.andExpect(jsonPath("$[?(@.code=='patients.read')]").isNotEmpty());
	}

	@Test
	void superAdminCreatesRoleInCurrentClinicOnly() throws Exception {
		String adminToken = adminBearer();
		long manageId = permissionId(adminToken, "roles.manage");
		long readId = permissionId(adminToken, "patients.read");

		mockMvc.perform(post("/api/roles")
				.header("Authorization", adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"auditor","name":"Auditor","permissionIds":[%d]}
						""".formatted(readId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.code").value("auditor"))
				.andExpect(jsonPath("$.name").value("Auditor"))
				.andExpect(jsonPath("$.permissionIds").value(org.hamcrest.Matchers.hasItem((int) readId)));

		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"roles-norte","name":"Norte Roles"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();
		long clinicId = objectMapper.readTree(clinic.getResponse().getContentAsString()).get("id").asLong();

		MvcResult switched = mockMvc.perform(post("/api/clinics/{id}/switch", clinicId)
				.header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andReturn();
		String norteToken = "Bearer " + objectMapper.readTree(switched.getResponse().getContentAsString())
				.get("token").asText();

		mockMvc.perform(get("/api/roles").header("Authorization", norteToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.code=='auditor')]").isEmpty());

		mockMvc.perform(post("/api/roles")
				.header("Authorization", norteToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"auditor","name":"Auditor Norte","permissionIds":[%d]}
						""".formatted(manageId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Auditor Norte"));
	}

	@Test
	void assigningRolesManageLetsStaffAdministerOwnClinic() throws Exception {
		signUp("staff-manager", "staff-manager@dentura.local");
		String adminToken = adminBearer();
		long staffId = clinicUserId(adminToken, "staff-manager");
		long managerRoleId = createRole(adminToken, "perm-manager", "Gestor permisos",
				permissionId(adminToken, "roles.manage"));

		mockMvc.perform(put("/api/roles/users/{userId}", staffId)
				.header("Authorization", adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"roleIds":[%d]}
						""".formatted(managerRoleId)))
				.andExpect(status().isOk());

		String staffToken = bearer("staff-manager");
		mockMvc.perform(get("/api/roles").header("Authorization", staffToken))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/roles")
				.header("Authorization", staffToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"caja","name":"Caja","permissionIds":[]}
						"""))
				.andExpect(status().isCreated());
	}

	@Test
	void cannotAssignRolesToUserOfAnotherClinic() throws Exception {
		MvcResult signup = mockMvc.perform(post("/api/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"alien-staff","email":"alien-staff@dentura.local","password":"123Qwe"}
						"""))
				.andExpect(status().isOk())
				.andReturn();
		long alienId = objectMapper.readTree(signup.getResponse().getContentAsString())
				.get("user")
				.get("id")
				.asLong();

		String adminToken = adminBearer();
		MvcResult clinic = mockMvc.perform(post("/api/clinics")
				.header("Authorization", adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"roles-oeste","name":"Oeste Roles"}
						"""))
				.andExpect(status().isCreated())
				.andReturn();
		long clinicId = objectMapper.readTree(clinic.getResponse().getContentAsString()).get("id").asLong();
		MvcResult switched = mockMvc.perform(post("/api/clinics/{id}/switch", clinicId)
				.header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andReturn();
		String oesteToken = "Bearer " + objectMapper.readTree(switched.getResponse().getContentAsString())
				.get("token")
				.asText();

		long receptionId = roleId(oesteToken, "recepcion");
		mockMvc.perform(put("/api/roles/users/{userId}", alienId)
				.header("Authorization", oesteToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"roleIds":[%d]}
						""".formatted(receptionId)))
				.andExpect(status().isForbidden());
	}

	private long roleId(String token, String code) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/roles").header("Authorization", token))
				.andExpect(status().isOk())
				.andReturn();
		for (JsonNode node : objectMapper.readTree(result.getResponse().getContentAsString())) {
			if (code.equals(node.get("code").asText())) {
				return node.get("id").asLong();
			}
		}
		throw new IllegalStateException("Missing role " + code);
	}

	private long permissionId(String token, String code) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/permissions").header("Authorization", token))
				.andExpect(status().isOk())
				.andReturn();
		for (JsonNode node : objectMapper.readTree(result.getResponse().getContentAsString())) {
			if (code.equals(node.get("code").asText())) {
				return node.get("id").asLong();
			}
		}
		throw new IllegalStateException("Missing permission " + code);
	}

	private long createRole(String token, String code, String name, long permissionId) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/roles")
				.header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"code":"%s","name":"%s","permissionIds":[%d]}
						""".formatted(code, name, permissionId)))
				.andExpect(status().isCreated())
				.andReturn();
		return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
	}

	private long clinicUserId(String token, String userName) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/roles/users").header("Authorization", token))
				.andExpect(status().isOk())
				.andReturn();
		for (JsonNode node : objectMapper.readTree(result.getResponse().getContentAsString())) {
			if (userName.equals(node.get("userName").asText())) {
				return node.get("id").asLong();
			}
		}
		throw new IllegalStateException("Missing user " + userName);
	}

	private void signUp(String userName, String email) throws Exception {
		mockMvc.perform(post("/api/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"%s","email":"%s","password":"123Qwe"}
						""".formatted(userName, email)))
				.andExpect(status().isOk());
	}

	private String bearer(String userName) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"userName":"%s","password":"123Qwe"}
						""".formatted(userName)))
				.andExpect(status().isOk())
				.andReturn();
		return "Bearer " + objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
	}

	private String adminBearer() throws Exception {
		return bearer("admin");
	}
}
