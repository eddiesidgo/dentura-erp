import ApiService from './ApiService'
import type {
    OdontogramEntry,
    OdontogramEntryPayload,
} from '@/@types/odontogram'

export async function apiGetOdontogramEntries(patientId: number | string) {
    return ApiService.fetchData<OdontogramEntry[]>({
        url: '/odontogram',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreateOdontogramEntry(data: OdontogramEntryPayload) {
    return ApiService.fetchData<OdontogramEntry>({
        url: '/odontogram',
        method: 'post',
        data,
    })
}

export async function apiUpdateOdontogramEntry(
    id: number | string,
    data: OdontogramEntryPayload,
) {
    return ApiService.fetchData<OdontogramEntry>({
        url: `/odontogram/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteOdontogramEntry(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/odontogram/${id}`,
        method: 'delete',
    })
}
