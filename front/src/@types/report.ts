export type ReportType =
    | 'WORKS_LIST'
    | 'WORKS_SUMMARY'
    | 'PATIENT_QUOTATION'

export type ReportClinicView = {
    id: number
    name: string
    nit: string | null
    addressLine: string | null
    cityLine: string | null
    phone: string | null
    email: string | null
    logoUrl: string | null
    logoDataUri: string | null
}

export type WorkReportRow = {
    patientName: string
    recordNumber: string
    treatmentCode: string
    treatmentName: string
    status: string
    statusLabel: string
    quantity: number
    unitPrice: string
    total: string
    tooth: string
    createdAt: string
}

export type StatusSummaryRow = {
    status: string
    statusLabel: string
    count: number
    total: string
}

export type PatientQuotationView = {
    recordNumber: string
    patientName: string
    dui: string | null
    phone: string | null
    rows: WorkReportRow[]
    pendingTotal: string
    completedTotal: string
    rejectedTotal: string
    quoteTotal: string
}

export type ReportDocument = {
    reportType: ReportType
    clinic: ReportClinicView
    title: string
    subtitle: string
    generatedAt: string
    documentDate: string
    year: string
    emptyMessage: string
    rows: WorkReportRow[] | null
    summaryRows: StatusSummaryRow[] | null
    quotation: PatientQuotationView | null
}

export type ReportParams = Record<string, string | number | undefined>
