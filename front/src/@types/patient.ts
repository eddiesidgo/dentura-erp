export type Patient = {
    id: number
    recordNumber: string
    firstName: string
    lastName: string
    sex: string | null
    dateOfBirth: string | null
    phone: string | null
    mobile: string | null
    email: string | null
    address: string | null
    city: string | null
    department: string | null
    dui: string | null
    nit: string | null
    occupation: string | null
    referredBy: string | null
    referralSourceId: number | null
    allergies: string | null
    notes: string | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export type PatientPayload = {
    recordNumber?: string
    firstName: string
    lastName: string
    sex?: string | null
    dateOfBirth?: string | null
    phone?: string | null
    mobile?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
    department?: string | null
    dui?: string | null
    nit?: string | null
    occupation?: string | null
    referredBy?: string | null
    referralSourceId?: number | null
    allergies?: string | null
    notes?: string | null
    active?: boolean
}

export type PatientPage = {
    data: Patient[]
    total: number
    pageIndex: number
    pageSize: number
}

export type PatientKpis = {
    totalPatients: number
    newPatientsThisMonth: number
    patientsWithUpcomingAppointment: number
    inactivePatients: number
    upcomingDays: number
    inactivityDays: number
}

export type PatientListParams = {
    q?: string
    page?: number
    size?: number
    sort?: string
    active?: boolean
}
