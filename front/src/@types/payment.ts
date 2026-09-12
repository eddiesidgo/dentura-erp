export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'

export type PaymentAllocation = {
    id: number
    workId: number | null
    amount: number
}

export type Payment = {
    id: number
    clinicId: number
    patientId: number
    receiptNumber: number
    paidAt: string
    amount: number
    method: PaymentMethod | string
    notes: string | null
    createdBy: number | null
    allocations: PaymentAllocation[]
    createdAt: string
    updatedAt: string
}

export type PaymentAllocationPayload = {
    workId?: number | null
    amount: number
}

export type PaymentPayload = {
    patientId: number
    paidAt?: string | null
    amount: number
    method: PaymentMethod | string
    notes?: string | null
    allocations?: PaymentAllocationPayload[]
}

export type PatientBalance = {
    patientId: number
    worksTotal: number
    paidTotal: number
    balance: number
}
