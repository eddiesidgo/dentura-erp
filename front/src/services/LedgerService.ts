import ApiService from './ApiService'
import type {
    LedgerEntry,
    LedgerManualPayload,
    LedgerStatement,
    Moroso,
} from '@/@types/ledger'

export async function apiGetLedger(patientId: number) {
    return ApiService.fetchData<LedgerEntry[]>({
        url: '/ledger',
        method: 'get',
        params: { patientId },
    })
}

export async function apiGetLedgerStatement(patientId: number) {
    return ApiService.fetchData<LedgerStatement>({
        url: '/ledger/statement',
        method: 'get',
        params: { patientId },
    })
}

export async function apiGetMorosos() {
    return ApiService.fetchData<Moroso[]>({
        url: '/ledger/morosos',
        method: 'get',
    })
}

export async function apiCreateLedgerEntry(data: LedgerManualPayload) {
    return ApiService.fetchData<LedgerEntry>({
        url: '/ledger',
        method: 'post',
        data,
    })
}
