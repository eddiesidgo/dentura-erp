import BaseService from './BaseService'

export type ReportPdfParams = Record<string, string | number | undefined>

const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export async function downloadReportPdf(
    path: string,
    filename: string,
    params?: ReportPdfParams,
) {
    const response = await BaseService.get(path, {
        params,
        responseType: 'blob',
    })
    downloadBlob(
        new Blob([response.data], { type: 'application/pdf' }),
        filename,
    )
}

export async function downloadWorksListPdf(params?: ReportPdfParams) {
    return downloadReportPdf('/reports/works/list.pdf', 'trabajos-listado.pdf', params)
}

export async function downloadWorksSummaryPdf(params?: ReportPdfParams) {
    return downloadReportPdf(
        '/reports/works/summary.pdf',
        'trabajos-resumen.pdf',
        params,
    )
}

export async function downloadPatientQuotationPdf(patientId: number) {
    return downloadReportPdf(
        `/reports/patients/${patientId}/quotation.pdf`,
        `cotizacion-paciente-${patientId}.pdf`,
    )
}
