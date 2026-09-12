import ApiService from './ApiService'
import type {
    Medication,
    MedicationListParams,
    MedicationPage,
    MedicationPayload,
} from '@/@types/medication'

export async function apiGetMedications(params: MedicationListParams) {
    return ApiService.fetchData<MedicationPage>({
        url: '/medications',
        method: 'get',
        params,
    })
}

export async function apiCreateMedication(data: MedicationPayload) {
    return ApiService.fetchData<Medication>({
        url: '/medications',
        method: 'post',
        data,
    })
}

export async function apiUpdateMedication(
    id: number | string,
    data: MedicationPayload,
) {
    return ApiService.fetchData<Medication>({
        url: `/medications/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteMedication(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/medications/${id}`,
        method: 'delete',
    })
}
