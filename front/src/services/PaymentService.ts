import ApiService from './ApiService'
import type {
    PatientBalance,
    Payment,
    PaymentPayload,
} from '@/@types/payment'

export async function apiGetPayments(patientId: number | string) {
    return ApiService.fetchData<Payment[]>({
        url: '/payments',
        method: 'get',
        params: { patientId },
    })
}

export async function apiGetPatientBalance(patientId: number | string) {
    return ApiService.fetchData<PatientBalance>({
        url: '/payments/balance',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreatePayment(data: PaymentPayload) {
    return ApiService.fetchData<Payment>({
        url: '/payments',
        method: 'post',
        data,
    })
}

export async function apiUpdatePayment(
    id: number | string,
    data: PaymentPayload,
) {
    return ApiService.fetchData<Payment>({
        url: `/payments/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeletePayment(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/payments/${id}`,
        method: 'delete',
    })
}
