import ApiService from './ApiService'
import type { AuditEventPage } from '@/@types/audit'

export async function apiGetAuditEvents(params?: {
    entityType?: string
    page?: number
    size?: number
}) {
    return ApiService.fetchData<AuditEventPage>({
        url: '/audit-events',
        method: 'get',
        params,
    })
}
