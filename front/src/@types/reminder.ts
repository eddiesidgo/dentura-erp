export type ReminderStatus = 'PENDING' | 'SENT' | 'SKIPPED'

export type Reminder = {
    id: number
    clinicId: number
    appointmentId: number
    patientId: number
    patientName: string
    phoneNormalized: string
    messageBody: string
    waMeUrl: string
    status: ReminderStatus
    scheduledFor: string
    sentAt: string | null
    appointmentStartAt: string | null
    createdAt: string
}

export type GenerateRemindersResult = {
    created: number
    skipped: number
}
