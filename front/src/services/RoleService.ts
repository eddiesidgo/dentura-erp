import ApiService from './ApiService'

export type Permission = {
    id: number
    code: string
    name: string
    description: string | null
}

export type Role = {
    id: number
    code: string
    name: string
    description: string | null
    systemRole: boolean
    permissionIds: number[]
}

export type ClinicUserRoles = {
    id: number
    userName: string
    email: string
    active: boolean
    roleIds: number[]
}

export async function apiGetPermissions() {
    return ApiService.fetchData<Permission[]>({
        url: '/permissions',
        method: 'get',
    })
}

export async function apiGetRoles() {
    return ApiService.fetchData<Role[]>({
        url: '/roles',
        method: 'get',
    })
}

export async function apiCreateRole(data: {
    code: string
    name: string
    description?: string
    permissionIds: number[]
}) {
    return ApiService.fetchData<Role>({
        url: '/roles',
        method: 'post',
        data,
    })
}

export async function apiUpdateRole(
    id: number,
    data: {
        code: string
        name: string
        description?: string
        permissionIds: number[]
    },
) {
    return ApiService.fetchData<Role>({
        url: `/roles/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteRole(id: number) {
    return ApiService.fetchData<void>({
        url: `/roles/${id}`,
        method: 'delete',
    })
}

export async function apiGetRoleUsers() {
    return ApiService.fetchData<ClinicUserRoles[]>({
        url: '/roles/users',
        method: 'get',
    })
}

export async function apiAssignUserRoles(userId: number, roleIds: number[]) {
    return ApiService.fetchData<ClinicUserRoles>({
        url: `/roles/users/${userId}`,
        method: 'put',
        data: { roleIds },
    })
}

export async function apiCreateClinicUser(data: {
    userName: string
    email: string
    password: string
    roleIds: number[]
}) {
    return ApiService.fetchData<ClinicUserRoles>({
        url: '/clinic-users',
        method: 'post',
        data,
    })
}

export async function apiUpdateClinicUser(
    id: number,
    data: {
        roleIds?: number[]
        active?: boolean
        password?: string
    },
) {
    return ApiService.fetchData<ClinicUserRoles>({
        url: `/clinic-users/${id}`,
        method: 'put',
        data,
    })
}
