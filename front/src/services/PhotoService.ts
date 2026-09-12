import ApiService from './ApiService'
import type { PatientPhoto, PhotoUploadParams } from '@/@types/photo'

export async function apiGetPatientPhotos(
    patientId: number | string,
    category?: string,
) {
    return ApiService.fetchData<PatientPhoto[]>({
        url: `/patients/${patientId}/photos`,
        method: 'get',
        params: category ? { category } : undefined,
    })
}

export async function apiUploadPatientPhoto(
    patientId: number | string,
    file: File,
    params: PhotoUploadParams,
) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', params.category)
    if (params.caption) {
        formData.append('caption', params.caption)
    }
    if (params.takenAt) {
        formData.append('takenAt', params.takenAt)
    }
    return ApiService.fetchData<PatientPhoto, FormData>({
        url: `/patients/${patientId}/photos`,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiGetPhotoFile(id: number | string) {
    return ApiService.fetchData<Blob>({
        url: `/photos/${id}/file`,
        method: 'get',
        responseType: 'blob',
    })
}

export async function apiDeletePhoto(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/photos/${id}`,
        method: 'delete',
    })
}
