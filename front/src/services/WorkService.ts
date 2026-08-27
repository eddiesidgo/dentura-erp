import ApiService from './ApiService'
import type { Work, WorkPayload } from '@/@types/work'

export async function apiGetWorks(patientId: number | string) {
    return ApiService.fetchData<Work[]>({
        url: '/works',
        method: 'get',
        params: { patientId },
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
