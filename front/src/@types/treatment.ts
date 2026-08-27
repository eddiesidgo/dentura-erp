export type Treatment = {
    id: number
    clinicId: number
    code: string
    name: string
    price: number
    active: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export type TreatmentPayload = {
    code: string
    name: string
    price?: number
    active?: boolean
    sortOrder?: number
}

export type TreatmentPage = {
    data: Treatment[]
    total: number
    pageIndex: number
    pageSize: number
}

export type TreatmentListParams = {
    q?: string
    page?: number
    size?: number
    sort?: string
    active?: boolean
}
