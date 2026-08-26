import ApiService from './ApiService'
import type { ClinicIdentity, UpdateClinicIdentityRequest } from '@/@types/clinic'
import type { SignInResponse } from '@/@types/auth'

export async function apiGetPublicClinicIdentity() {
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinic-identity',
        method: 'get',
    })
}

export async function apiGetCurrentClinic() {
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinics/current',
        method: 'get',
    })
}

export async function apiUpdateCurrentClinic(data: UpdateClinicIdentityRequest) {
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinics/current',
        method: 'put',
        data,
    })
}

export async function apiGetClinics() {
    return ApiService.fetchData<ClinicIdentity[]>({
        url: '/clinics',
        method: 'get',
    })
}

export async function apiSwitchClinic(id: number) {
    return ApiService.fetchData<SignInResponse>({
        url: `/clinics/${id}/switch`,
        method: 'post',
    })
}

export async function apiCreateClinic(data: { code: string; name: string }) {
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinics',
        method: 'post',
        data,
    })
}
