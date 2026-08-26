package com.dentura.api.role.dto;

import java.util.List;

public record AssignRolesRequest(List<Long> roleIds) {
}
