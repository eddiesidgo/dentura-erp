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
    startAt: string
    endAt: string
    status?: AppointmentStatus
    reason?: string | null
    notes?: string | null
}
