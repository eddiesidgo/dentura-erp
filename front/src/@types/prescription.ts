export type Prescription = {
    id: number
    clinicId: number
    patientId: number
    drug: string
    dose: string | null
    frequency: string | null
    duration: string | null
    instructions: string | null
    prescribedAt: string
    medicationId: number | null
    templateId: number | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type PrescriptionPayload = {
    patientId: number
    drug: string
    dose?: string | null
    frequency?: string | null
    duration?: string | null
    instructions?: string | null
    prescribedAt?: string | null
    medicationId?: number | null
    templateId?: number | null
    notes?: string | null
}

export type PrescriptionTemplate = {
    id: number
    clinicId: number
    drug: string
    dose: string | null
    frequency: string | null
    duration: string | null
    instructions: string | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export type PrescriptionTemplatePayload = {
    drug: string
    dose?: string | null
    frequency?: string | null
    duration?: string | null
    instructions?: string | null
    active?: boolean
}
