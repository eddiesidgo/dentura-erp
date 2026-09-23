import ApiService from './ApiService'
import type {
    ClinicDeliveryPreset,
    ClinicIdentity,
    UpdateClinicIdentityRequest,
} from '@/@types/clinic'
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

export async function apiCreateClinic(data: {
    code: string
    name: string
    preset?: ClinicDeliveryPreset
}) {
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinics',
        method: 'post',
        data,
    })
}

export async function apiUploadClinicLogo(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return ApiService.fetchData<ClinicIdentity>({
        url: '/clinics/current/logo',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
