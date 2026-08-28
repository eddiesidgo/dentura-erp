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
