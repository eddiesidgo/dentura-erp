import ApiService from './ApiService'
import type {
    Work,
    WorkListParams,
    WorkPayload,
    WorkTreatmentSummary,
} from '@/@types/work'

export async function apiGetWorks(
    patientIdOrParams: number | string | WorkListParams,
) {
    const params =
        typeof patientIdOrParams === 'object'
            ? patientIdOrParams
            : { patientId: patientIdOrParams }
    return ApiService.fetchData<Work[]>({
        url: '/works',
        method: 'get',
        params,
    })
}

export async function apiGetWorksSummaryByTreatment(params?: WorkListParams) {
    return ApiService.fetchData<WorkTreatmentSummary[]>({
        url: '/works/summary-by-treatment',
        method: 'get',
        params,
    })
}

export async function apiCreateWork(data: WorkPayload) {
    return ApiService.fetchData<Work>({
        url: '/works',
        method: 'post',
        data,
    })
}

export async function apiUpdateWork(id: number | string, data: WorkPayload) {
    return ApiService.fetchData<Work>({
        url: `/works/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteWork(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/works/${id}`,
        method: 'delete',
    })
}
