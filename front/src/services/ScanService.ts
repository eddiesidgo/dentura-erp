import ApiService from './ApiService'
import type { PatientScan, ScanUploadParams } from '@/@types/scan'

export async function apiGetPatientScans(
    patientId: number | string,
    arch?: string,
) {
    return ApiService.fetchData<PatientScan[]>({
        url: `/patients/${patientId}/scans`,
        method: 'get',
        params: arch ? { arch } : undefined,
    })
}

export async function apiUploadPatientScan(
    patientId: number | string,
    file: File,
    params: ScanUploadParams,
) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('arch', params.arch)
    if (params.caption) {
        formData.append('caption', params.caption)
    }
    return ApiService.fetchData<PatientScan, FormData>({
        url: `/patients/${patientId}/scans`,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiGetScanFile(id: number | string) {
    return ApiService.fetchData<Blob>({
        url: `/scans/${id}/file`,
        method: 'get',
        responseType: 'blob',
    })
}

export async function apiDeleteScan(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/scans/${id}`,
        method: 'delete',
    })
}
