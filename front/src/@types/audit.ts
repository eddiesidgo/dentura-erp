export type AuditEvent = {
    id: number
    clinicId: number | null
    userId: number | null
    username: string | null
    action: string
    entityType: string
    entityId: string | null
    detail: string | null
    createdAt: string
}

export type AuditEventPage = {
    data: AuditEvent[]
    total: number
    page: number
    size: number
}
