import ApiService from './ApiService'
import type {
    Prescription,
    PrescriptionPayload,
    PrescriptionTemplate,
    PrescriptionTemplatePayload,
} from '@/@types/prescription'

export async function apiGetPrescriptions(patientId: number | string) {
    return ApiService.fetchData<Prescription[]>({
        url: '/prescriptions',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreatePrescription(data: PrescriptionPayload) {
    return ApiService.fetchData<Prescription>({
        url: '/prescriptions',
        method: 'post',
        data,
    })
}

export async function apiUpdatePrescription(
    id: number | string,
    data: PrescriptionPayload,
) {
    return ApiService.fetchData<Prescription>({
        url: `/prescriptions/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeletePrescription(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/prescriptions/${id}`,
        method: 'delete',
    })
}

export async function apiGetPrescriptionTemplates() {
    return ApiService.fetchData<PrescriptionTemplate[]>({
        url: '/prescription-templates',
        method: 'get',
    })
}

export async function apiCreatePrescriptionTemplate(
    data: PrescriptionTemplatePayload,
) {
    return ApiService.fetchData<PrescriptionTemplate>({
        url: '/prescription-templates',
        method: 'post',
        data,
    })
}

export async function apiUpdatePrescriptionTemplate(
    id: number | string,
    data: PrescriptionTemplatePayload,
) {
    return ApiService.fetchData<PrescriptionTemplate>({
        url: `/prescription-templates/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeletePrescriptionTemplate(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/prescription-templates/${id}`,
        method: 'delete',
    })
}
