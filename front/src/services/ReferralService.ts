import ApiService from './ApiService'
import type {
    OutboundReferral,
    OutboundReferralPayload,
    ReferralSource,
    ReferralSourcePayload,
} from '@/@types/referral'

export async function apiGetReferralSources() {
    return ApiService.fetchData<ReferralSource[]>({
        url: '/referral-sources',
        method: 'get',
    })
}

export async function apiCreateReferralSource(data: ReferralSourcePayload) {
    return ApiService.fetchData<ReferralSource>({
        url: '/referral-sources',
        method: 'post',
        data,
    })
}

export async function apiUpdateReferralSource(
    id: number | string,
    data: ReferralSourcePayload,
) {
    return ApiService.fetchData<ReferralSource>({
        url: `/referral-sources/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteReferralSource(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/referral-sources/${id}`,
        method: 'delete',
    })
}

export async function apiGetOutboundReferrals(patientId: number | string) {
    return ApiService.fetchData<OutboundReferral[]>({
        url: '/outbound-referrals',
        method: 'get',
        params: { patientId },
    })
}

export async function apiCreateOutboundReferral(data: OutboundReferralPayload) {
    return ApiService.fetchData<OutboundReferral>({
        url: '/outbound-referrals',
        method: 'post',
        data,
    })
}

export async function apiUpdateOutboundReferral(
    id: number | string,
    data: OutboundReferralPayload,
) {
    return ApiService.fetchData<OutboundReferral>({
        url: `/outbound-referrals/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteOutboundReferral(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/outbound-referrals/${id}`,
        method: 'delete',
    })
}
