import ApiService from './ApiService'
import type {
    Treatment,
    TreatmentListParams,
    TreatmentPage,
    TreatmentPayload,
} from '@/@types/treatment'

export async function apiGetTreatments(params: TreatmentListParams) {
    return ApiService.fetchData<TreatmentPage>({
        url: '/treatments',
        method: 'get',
        params,
    })
}

export async function apiGetTreatment(id: number | string) {
    return ApiService.fetchData<Treatment>({
        url: `/treatments/${id}`,
        method: 'get',
    })
}

export async function apiCreateTreatment(data: TreatmentPayload) {
    return ApiService.fetchData<Treatment>({
        url: '/treatments',
        method: 'post',
        data,
    })
}

export async function apiUpdateTreatment(
    id: number | string,
    data: TreatmentPayload,
) {
    return ApiService.fetchData<Treatment>({
        url: `/treatments/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteTreatment(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/treatments/${id}`,
        method: 'delete',
    })
}
