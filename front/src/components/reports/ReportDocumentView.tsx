import { forwardRef } from 'react'
import classNames from 'classnames'
import type {
    PatientQuotationView,
    ReportClinicView,
    ReportDocument,
    StatusSummaryRow,
    WorkReportRow,
} from '@/@types/report'
import appConfig from '@/configs/app.config'

const resolveLogoSrc = (clinic: ReportClinicView) => {
    if (clinic.logoDataUri) {
        return clinic.logoDataUri
    }
    if (!clinic.logoUrl) {
        return null
    }
    if (clinic.logoUrl.startsWith('http') || clinic.logoUrl.startsWith('data:')) {
        return clinic.logoUrl
    }
    const prefix = appConfig.apiPrefix.replace(/\/$/, '')
    const path = clinic.logoUrl.startsWith('/') ? clinic.logoUrl : `/${clinic.logoUrl}`
    return `${prefix}${path}`
}

const statusBadgeClass = (status: string) => {
    if (status === 'COMPLETED') {
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
    if (status === 'REJECTED') {
        return 'bg-rose-50 text-rose-800 border-rose-200'
    }
    return 'bg-amber-50 text-amber-800 border-amber-200'
}

const StatusBadge = ({ status, label }: { status: string; label: string }) => (
    <span
        className={classNames(
            'inline-block rounded px-2 py-0.5 text-[10px] font-semibold border',
            statusBadgeClass(status),
        )}
    >
        {label}
    </span>
)

const Letterhead = ({
    clinic,
    documentDate,
}: {
    clinic: ReportClinicView
    documentDate: string
}) => {
    const logoSrc = resolveLogoSrc(clinic)
    const initial = clinic.name?.charAt(0)?.toUpperCase() || 'C'
    const cityLabel = clinic.cityLine || 'San Salvador'

    return (
        <>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
            >
                <span className="font-serif text-[9rem] font-bold leading-none text-sky-900/5">
                    {initial}
                </span>
                <span className="mt-1 text-sm font-serif uppercase tracking-[0.35em] text-sky-900/5">
                    {clinic.name}
                </span>
            </div>

            <header className="relative text-center pb-5 mb-5 border-b-2 border-sky-900">
                {logoSrc && (
                    <img
                        src={logoSrc}
                        alt=""
                        className="mx-auto mb-3 max-h-16 max-w-[200px] object-contain"
                        crossOrigin="anonymous"
                    />
                )}
                <h1 className="font-serif italic text-[1.65rem] text-sky-900 tracking-wide">
                    {clinic.name}
                </h1>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sky-800/80">
                    Odontología · Plan de tratamiento
                </p>
            </header>

            <p className="relative text-right text-[11px] text-gray-600 mb-5">
                {cityLabel}, {documentDate}
            </p>
        </>
    )
}

const DocHeading = ({
    title,
    subtitle,
}: {
    title: string
    subtitle: string
}) => (
    <div className="relative mb-6 border-l-4 border-sky-900 bg-slate-50 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-900">
            {title}
        </h2>
        {subtitle && (
            <p className="mt-1 text-[11px] text-gray-600">{subtitle}</p>
        )}
    </div>
)

const ReportFooter = ({
    clinic,
    generatedAt,
    year,
}: {
    clinic: ReportClinicView
    generatedAt: string
    year: string
}) => (
    <footer className="relative mt-10 border-t border-gray-200 pt-4 text-center">
        {clinic.addressLine && (
            <p className="text-[10px] italic text-sky-900">{clinic.addressLine}</p>
        )}
        <p className="text-[10px] italic text-sky-900">
            {[clinic.cityLine, clinic.phone ? `Tel. ${clinic.phone}` : null, clinic.email]
                .filter(Boolean)
                .join(' · ')}
        </p>
        {clinic.nit && (
            <p className="mt-0.5 text-[9px] text-gray-500">NIT {clinic.nit}</p>
        )}
        <p className="mt-2 text-[8px] text-gray-400">
            Generado {generatedAt} · Dentura ERP · {year}
        </p>
    </footer>
)

const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
        {message}
    </div>
)

const WorksTable = ({ rows }: { rows: WorkReportRow[] }) => (
    <table className="relative w-full border-collapse text-[11px]">
        <thead>
            <tr className="bg-sky-900 text-white">
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Paciente
                </th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Exp.
                </th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Tratamiento
                </th>
                <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">
                    Ubic.
                </th>
                <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">
                    Cant.
                </th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                    Precio
                </th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                    Total
                </th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Estado
                </th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Fecha
                </th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, index) => (
                <tr
                    key={`${row.recordNumber}-${row.treatmentCode}-${index}`}
                    className={index % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                >
                    <td className="border-b border-gray-200 px-2 py-2 font-medium">
                        {row.patientName}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-gray-500">
                        {row.recordNumber}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2">
                        <span className="font-semibold">{row.treatmentCode}</span>
                        <br />
                        <span className="text-[10px] text-gray-500">
                            {row.treatmentName}
                        </span>
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-center">
                        {row.tooth}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-center">
                        {row.quantity}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-right">
                        {row.unitPrice}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-right font-semibold">
                        {row.total}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2">
                        <StatusBadge status={row.status} label={row.statusLabel} />
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-gray-500">
                        {row.createdAt}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)

const QuotationWorksTable = ({ rows }: { rows: WorkReportRow[] }) => (
    <table className="relative w-full border-collapse text-[11px]">
        <thead>
            <tr className="bg-sky-900 text-white">
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Tratamiento
                </th>
                <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">
                    Ubic.
                </th>
                <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">
                    Cant.
                </th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                    Precio
                </th>
                <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">
                    Total
                </th>
                <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">
                    Estado
                </th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, index) => (
                <tr
                    key={`${row.treatmentCode}-${index}`}
                    className={index % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                >
                    <td className="border-b border-gray-200 px-2 py-2">
                        <span className="font-semibold">{row.treatmentCode}</span>
                        <br />
                        <span className="text-[10px] text-gray-500">
                            {row.treatmentName}
                        </span>
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-center">
                        {row.tooth}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-center">
                        {row.quantity}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-right">
                        {row.unitPrice}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2 text-right font-semibold">
                        {row.total}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-2">
                        <StatusBadge status={row.status} label={row.statusLabel} />
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)

const SummaryCards = ({ rows }: { rows: StatusSummaryRow[] }) => (
    <div className="relative mb-6 grid grid-cols-3 gap-3">
        {rows.map((row) => (
            <div
                key={row.status}
                className="rounded border border-gray-200 border-t-[3px] border-t-sky-900 bg-white px-3 py-4 text-center"
            >
                <StatusBadge status={row.status} label={row.statusLabel} />
                <p className="mt-2 font-serif text-2xl font-bold text-sky-900">
                    {row.count}
                </p>
                <p className="text-sm font-semibold text-gray-800">{row.total}</p>
            </div>
        ))}
    </div>
)

const SummaryTable = ({ rows }: { rows: StatusSummaryRow[] }) => (
    <table className="relative w-full border-collapse text-[11px]">
        <thead>
            <tr className="bg-sky-900 text-white">
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">
                    Estado
                </th>
                <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide">
                    Trabajos
                </th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide">
                    Monto total
                </th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, index) => (
                <tr
                    key={row.status}
                    className={index % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                >
                    <td className="border-b border-gray-200 px-3 py-2">
                        <StatusBadge status={row.status} label={row.statusLabel} />
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2 text-center font-semibold">
                        {row.count}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2 text-right font-semibold">
                        {row.total}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)

const PatientBox = ({ quotation }: { quotation: PatientQuotationView }) => (
    <div className="relative mb-6 border border-gray-200 border-t-[3px] border-t-sky-900 bg-white px-4 py-3">
        <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Paciente</p>
        <p className="font-serif text-lg font-bold text-sky-900">
            {quotation.patientName}
        </p>
        <p className="text-[11px] text-gray-600">
            Expediente <strong>{quotation.recordNumber}</strong>
            {quotation.dui && <> · DUI {quotation.dui}</>}
            {quotation.phone && <> · Tel. {quotation.phone}</>}
        </p>
    </div>
)

const QuotationTotals = ({ quotation }: { quotation: PatientQuotationView }) => (
    <div className="relative mt-6 flex justify-end">
        <table className="w-full max-w-xs text-[11px]">
            <tbody>
                <tr>
                    <td className="py-1.5 text-gray-600">Pendiente</td>
                    <td className="py-1.5 text-right font-semibold">
                        {quotation.pendingTotal}
                    </td>
                </tr>
                <tr>
                    <td className="py-1.5 text-gray-600">Terminado</td>
                    <td className="py-1.5 text-right font-semibold">
                        {quotation.completedTotal}
                    </td>
                </tr>
                <tr>
                    <td className="py-1.5 text-gray-600">No aceptado</td>
                    <td className="py-1.5 text-right font-semibold">
                        {quotation.rejectedTotal}
                    </td>
                </tr>
                <tr className="border-t-2 border-sky-900 bg-sky-50/60">
                    <td className="py-2.5 font-semibold text-sky-900">
                        Cotización (pendiente + terminado)
                    </td>
                    <td className="py-2.5 text-right text-sm font-bold text-sky-900">
                        {quotation.quoteTotal}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
)

const SignatureBlock = ({ clinicName }: { clinicName: string }) => (
    <div className="relative mt-8 w-56">
        <p className="text-sm text-gray-800">Atentamente,</p>
        <div className="mt-8 border-b border-dotted border-gray-400" />
        <p className="mt-1 text-[11px] text-gray-600">{clinicName}</p>
    </div>
)

type ReportDocumentViewProps = {
    document: ReportDocument
}

const ReportDocumentView = forwardRef<HTMLDivElement, ReportDocumentViewProps>(
    ({ document }, ref) => {
        const { clinic, reportType } = document
        const rows = document.rows ?? []
        const summaryRows = document.summaryRows ?? []
        const quotation = document.quotation
        const hasRows = rows.length > 0
        const hasSummary = summaryRows.length > 0

        return (
            <div
                ref={ref}
                className="relative mx-auto w-[210mm] min-h-[297mm] bg-white px-[16mm] py-[14mm] text-gray-900 shadow-xl print:shadow-none"
            >
                <Letterhead clinic={clinic} documentDate={document.documentDate} />
                <DocHeading title={document.title} subtitle={document.subtitle} />

                {reportType === 'WORKS_LIST' && (
                    <>
                        {!hasRows && <EmptyState message={document.emptyMessage} />}
                        {hasRows && <WorksTable rows={rows} />}
                    </>
                )}

                {reportType === 'WORKS_SUMMARY' && (
                    <>
                        {!hasSummary && <EmptyState message={document.emptyMessage} />}
                        {hasSummary && (
                            <>
                                <SummaryCards rows={summaryRows} />
                                <SummaryTable rows={summaryRows} />
                            </>
                        )}
                    </>
                )}

                {reportType === 'PATIENT_QUOTATION' && quotation && (
                    <>
                        <PatientBox quotation={quotation} />
                        {!hasRows && <EmptyState message={document.emptyMessage} />}
                        {hasRows && (
                            <>
                                <QuotationWorksTable rows={rows} />
                                <QuotationTotals quotation={quotation} />
                                <p className="relative mt-4 text-[10px] italic text-gray-500">
                                    Este documento es una cotización orientativa del plan de
                                    tratamiento. No constituye factura ni comprobante fiscal.
                                </p>
                                <SignatureBlock clinicName={clinic.name} />
                            </>
                        )}
                    </>
                )}

                <ReportFooter
                    clinic={clinic}
                    generatedAt={document.generatedAt}
                    year={document.year}
                />
            </div>
        )
    },
)

ReportDocumentView.displayName = 'ReportDocumentView'

export default ReportDocumentView
