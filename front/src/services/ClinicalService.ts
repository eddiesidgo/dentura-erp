import ApiService from './ApiService'
import type {
    ConsentTemplate,
    PatientConsent,
    PeriodontogramEntry,
} from '@/@types/clinical'

export async function apiGetPeriodontogram(patientId: number) {
    return ApiService.fetchData<PeriodontogramEntry[]>({
        url: '/periodontogram',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreatePeriodontogramEntry(data: {
    patientId: number
    tooth: string
    valuesJson?: string | null
    notes?: string | null
}) {
    return ApiService.fetchData<PeriodontogramEntry>({
        url: '/periodontogram',
        method: 'post',
        data,
    })
}

export async function apiDeletePeriodontogramEntry(id: number) {
    return ApiService.fetchData<void>({
        url: `/periodontogram/${id}`,
        method: 'delete',
    })
}

export async function apiGetConsentTemplates(activeOnly = true) {
    return ApiService.fetchData<ConsentTemplate[]>({
        url: '/consents/templates',
        method: 'get',
        params: { activeOnly },
    })
}

export async function apiCreateConsentTemplate(data: {
    title: string
    bodyHtml: string
    active?: boolean
}) {
    return ApiService.fetchData<ConsentTemplate>({
        url: '/consents/templates',
        method: 'post',
        data,
    })
}

export async function apiGetPatientConsents(patientId: number) {
    return ApiService.fetchData<PatientConsent[]>({
        url: '/consents',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreatePatientConsent(data: {
    patientId: number
    templateId: number
    signerName: string
    notes?: string | null
}) {
    return ApiService.fetchData<PatientConsent>({
        url: '/consents',
        method: 'post',
        data,
    })
}

export function consentPdfUrl(id: number) {
    return `/api/consents/${id}/pdf`
}
