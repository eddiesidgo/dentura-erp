import ApiService from './ApiService'
import type {
    SmileDesign,
    SmileDesignDocument,
    SmileDesignPayload,
    SmileSuggestPayload,
} from '@/@types/smile'

export async function apiGetPatientSmileDesigns(patientId: number | string) {
    return ApiService.fetchData<SmileDesign[]>({
        url: `/patients/${patientId}/smile-designs`,
        method: 'get',
    })
}

export async function apiCreateSmileDesign(payload: SmileDesignPayload) {
    return ApiService.fetchData<SmileDesign, SmileDesignPayload>({
        url: `/smile-designs`,
        method: 'post',
        data: payload,
    })
}

export async function apiUpdateSmileDesign(
    id: number | string,
    payload: SmileDesignPayload,
) {
    return ApiService.fetchData<SmileDesign, SmileDesignPayload>({
        url: `/smile-designs/${id}`,
        method: 'put',
        data: payload,
    })
}

export async function apiDeleteSmileDesign(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/smile-designs/${id}`,
        method: 'delete',
    })
}

export async function apiSuggestSmileDesign(
    patientId: number | string,
    payload: SmileSuggestPayload,
) {
    return ApiService.fetchData<SmileDesignDocument, SmileSuggestPayload>({
        url: `/patients/${patientId}/smile-designs/suggest`,
        method: 'post',
        data: payload,
    })
}

export async function apiUploadSmileExport(
    id: number | string,
    file: File,
) {
    const formData = new FormData()
    formData.append('file', file)
    return ApiService.fetchData<SmileDesign, FormData>({
        url: `/smile-designs/${id}/export`,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiDownloadSmileExport(id: number | string) {
    return ApiService.fetchData<Blob>({
        url: `/smile-designs/${id}/export`,
        method: 'get',
        responseType: 'blob',
    })
}
