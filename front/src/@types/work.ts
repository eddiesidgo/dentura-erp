export type WorkStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

export type Work = {
    id: number
    clinicId: number
    patientId: number
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
