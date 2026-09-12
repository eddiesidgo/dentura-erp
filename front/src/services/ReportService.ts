import BaseService from './BaseService'
import type { ReportDocument, ReportParams } from '@/@types/report'

export type { ReportParams }

export async function fetchWorksListReport(params?: ReportParams) {
    const response = await BaseService.get<ReportDocument>(
        '/reports/works/list.json',
        { params },
    )
    return response.data
}

export async function fetchWorksSummaryReport(params?: ReportParams) {
    const response = await BaseService.get<ReportDocument>(
        '/reports/works/summary.json',
        { params },
    )
    return response.data
}

export async function fetchPatientQuotationReport(patientId: number) {
    const response = await BaseService.get<ReportDocument>(
        `/reports/patients/${patientId}/quotation.json`,
    )
    return response.data
}

export async function fetchPaymentReceiptReport(paymentId: number) {
    const response = await BaseService.get<ReportDocument>(
        `/reports/payments/${paymentId}.json`,
    )
    return response.data
}

export async function fetchPrescriptionReport(prescriptionId: number) {
    const response = await BaseService.get<ReportDocument>(
        `/reports/prescriptions/${prescriptionId}.json`,
    )
    return response.data
}

export async function fetchPaymentsSummaryReport(params?: ReportParams) {
    const response = await BaseService.get<ReportDocument>(
        '/reports/payments/summary.json',
        { params },
    )
    return response.data
}

export async function fetchReferralsBySourceReport() {
    const response = await BaseService.get<ReportDocument>(
        '/reports/referrals/by-source.json',
    )
    return response.data
}
