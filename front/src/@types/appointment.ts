export type AppointmentStatus =
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW'

export type Appointment = {
    id: number
    clinicId: number
    patientId: number
    patientName: string
    recordNumber: string
    providerId: number
    providerName: string
    providerColor: string
    roomId: number | null
    roomName: string | null
    startAt: string
    endAt: string
    status: AppointmentStatus
    reason: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type AppointmentPayload = {
    patientId: number
    providerId?: number | null
    roomId?: number | null
    startAt: string
    endAt: string
    status?: AppointmentStatus
    reason?: string | null
    notes?: string | null
}

export type Provider = {
    id: number
    clinicId: number
    name: string
    color: string
    userId: number | null
    active: boolean
}

export type Room = {
    id: number
    clinicId: number
    name: string
    active: boolean
}
