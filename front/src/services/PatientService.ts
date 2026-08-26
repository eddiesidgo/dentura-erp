import ApiService from './ApiService'
import type {
    Patient,
    PatientListParams,
    PatientPage,
    PatientPayload,
} from '@/@types/patient'

export async function apiGetPatients(params: PatientListParams) {
    return ApiService.fetchData<PatientPage>({
        url: '/patients',
        method: 'get',
        params,
    })
}

export async function apiGetPatient(id: number | string) {
    return ApiService.fetchData<Patient>({
        url: `/patients/${id}`,
        method: 'get',
    })
}

export async function apiCreatePatient(data: PatientPayload) {
    return ApiService.fetchData<Patient>({
        url: '/patients',
        method: 'post',
        data,
    })
}

export async function apiUpdatePatient(id: number | string, data: PatientPayload) {
    return ApiService.fetchData<Patient>({
        url: `/patients/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeletePatient(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/patients/${id}`,
        method: 'delete',
    })
}

export function getApiErrorMessage(error: unknown, fallback: string) {
    const err = error as { response?: { data?: { message?: string } } }
    return err.response?.data?.message || fallback
}
