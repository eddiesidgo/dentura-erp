export type ReportType =
    | 'WORKS_LIST'
    | 'WORKS_SUMMARY'
    | 'PATIENT_QUOTATION'
    | 'PAYMENT_RECEIPT'
    | 'PRESCRIPTION'
    | 'PAYMENTS_SUMMARY'
    | 'REFERRALS_BY_SOURCE'

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

export type PaymentReceiptAllocation = {
    description: string
    amount: string
}

export type PaymentReceiptView = {
    receiptNumber: number
    paidAt: string
    amount: string
    method: string
    methodLabel: string
    notes: string | null
    patientName: string
    recordNumber: string
    dui: string | null
    phone: string | null
    allocations: PaymentReceiptAllocation[]
}

export type PrescriptionReportView = {
    patientName: string
    recordNumber: string
    dui: string | null
    phone: string | null
    drug: string
    dose: string | null
    frequency: string | null
    duration: string | null
    instructions: string | null
    notes: string | null
    prescribedAt: string
}

export type GenericReportRow = {
    label: string
    value: string
    secondary?: string | null
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
    paymentReceipt: PaymentReceiptView | null
    prescription: PrescriptionReportView | null
    genericRows: GenericReportRow[] | null
}

export type ReportParams = Record<string, string | number | undefined>
