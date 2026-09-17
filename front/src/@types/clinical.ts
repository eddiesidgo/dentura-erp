export type PeriodontogramEntry = {
    id: number
    clinicId: number
    patientId: number
    tooth: string
    valuesJson: string | null
    notes: string | null
    recordedAt: string
    createdAt: string
    updatedAt: string
}

export type ConsentTemplate = {
    id: number
    clinicId: number
    title: string
    bodyHtml: string
    active: boolean
}

export type PatientConsent = {
    id: number
    clinicId: number
    patientId: number
    templateId: number
    templateTitle: string
    signerName: string
    acceptedAt: string
    notes: string | null
    createdAt: string
}
