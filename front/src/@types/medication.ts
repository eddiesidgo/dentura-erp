export type Medication = {
    id: number
    clinicId: number
    code: string
    name: string
    form: string | null
    dose: string | null
    frequency: string | null
    duration: string | null
    instructions: string | null
    active: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export type MedicationPayload = {
    code: string
    name: string
    form?: string | null
    dose?: string | null
    frequency?: string | null
    duration?: string | null
    instructions?: string | null
    active?: boolean
    sortOrder?: number
}

export type MedicationPage = {
    data: Medication[]
    total: number
    pageIndex: number
    pageSize: number
}

export type MedicationListParams = {
    q?: string
    page?: number
    size?: number
    sort?: string
    active?: boolean
}
