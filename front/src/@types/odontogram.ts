export type OdontogramCondition =
    | 'CARIES'
    | 'FILLING'
    | 'MISSING'
    | 'CROWN'
    | 'ENDO'
    | 'IMPLANT'
    | 'EXTRACTION_PLANNED'
    | 'OTHER'

export type OdontogramStatus = 'EXISTING' | 'PLANNED' | 'COMPLETED'

export type OdontogramEntry = {
    id: number
    clinicId: number
    patientId: number
    tooth: string
    surfaces: string | null
    condition: OdontogramCondition
    status: OdontogramStatus
    workId: number | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type OdontogramEntryPayload = {
    patientId: number
    tooth: string
    surfaces?: string | null
    condition: OdontogramCondition | string
    status?: OdontogramStatus | string | null
    workId?: number | null
    notes?: string | null
}
