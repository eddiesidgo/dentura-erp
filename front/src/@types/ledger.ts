export type LedgerEntryType = 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT'

export type LedgerEntry = {
    id: number
    clinicId: number
    patientId: number
    workId: number | null
    type: LedgerEntryType
    amount: number
    description: string | null
    entryDate: string
    paymentId: number | null
    createdAt: string
}

export type LedgerStatement = {
    patientId: number
    patientName: string
    recordNumber: string
    chargesTotal: number
    paymentsTotal: number
    adjustmentsTotal: number
    balance: number
    entries: LedgerEntry[]
}

export type Moroso = {
    patientId: number
    patientName: string
    recordNumber: string
    phone: string | null
    chargesTotal: number
    paymentsTotal: number
    adjustmentsTotal: number
    balance: number
}

export type LedgerManualPayload = {
    patientId: number
    workId?: number | null
    type: 'CHARGE' | 'ADJUSTMENT'
    amount: number
    description?: string | null
    entryDate?: string | null
}
