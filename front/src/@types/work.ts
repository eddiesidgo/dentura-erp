export type WorkStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

export type Work = {
    id: number
    clinicId: number
    patientId: number
    patientName?: string | null
    recordNumber?: string | null
    treatmentId: number
    treatmentCode: string
    treatmentName: string
    status: WorkStatus
    quantity: number
    unitPrice: number
    total: number
    tooth: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type WorkPayload = {
    patientId: number
    treatmentId: number
    status?: WorkStatus
    quantity?: number
    unitPrice?: number
    tooth?: string | null
    notes?: string | null
}

export type WorkListParams = {
    patientId?: number
    treatmentId?: number
    status?: WorkStatus | string
    from?: string
    to?: string
}

export type WorkTreatmentSummary = {
    treatmentId: number
    treatmentCode: string
    treatmentName: string
    totalWorks: number
    pendingCount: number
    completedCount: number
    rejectedCount: number
    quantityTotal: number
    amountTotal: number
    completedAmount: number
}
