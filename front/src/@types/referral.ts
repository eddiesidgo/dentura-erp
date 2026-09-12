export type ReferralSourceType = 'PERSON' | 'CLINIC' | 'OTHER'

export type ReferralSource = {
    id: number
    clinicId: number
    name: string
    type: ReferralSourceType | string
    phone: string | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export type ReferralSourcePayload = {
    name: string
    type: ReferralSourceType | string
    phone?: string | null
    active?: boolean
}

export type OutboundReferralStatus =
    | 'DRAFT'
    | 'SENT'
    | 'COMPLETED'
    | 'CANCELLED'

export type OutboundReferral = {
    id: number
    clinicId: number
    patientId: number
    specialty: string
    toName: string | null
    reason: string | null
    status: OutboundReferralStatus | string
    referredAt: string
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type OutboundReferralPayload = {
    patientId: number
    specialty: string
    toName?: string | null
    reason?: string | null
    status?: OutboundReferralStatus | string | null
    referredAt?: string | null
    notes?: string | null
}
