import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
    HiOutlineCash,
    HiOutlineClipboardList,
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import IconTile from '@/components/shared/IconTile'
import PageHeader from '@/components/shared/PageHeader'
import ReportPreviewModal from '@/components/reports/ReportPreviewModal'
import type { ReportPreviewKind } from '@/components/reports/ReportPreviewModal'
import {
    Button,
    Card,
    DatePicker,
    Select,
} from '@/components/ui'
import { workStatusOptions } from '@/views/patients/works.constants'
import type { ReportParams } from '@/services/ReportService'

type StatusOption = { value: string; label: string }

const statusFilterOptions: StatusOption[] = [
    { value: '', label: 'Todos los estados' },
    ...workStatusOptions,
]

type PreviewState = {
    kind: ReportPreviewKind
    params?: ReportParams
    filename: string
}

const ReportList = () => {
    const [listStatus, setListStatus] = useState('')
    const [listFrom, setListFrom] = useState<Date | null>(null)
    const [listTo, setListTo] = useState<Date | null>(null)
    const [summaryFrom, setSummaryFrom] = useState<Date | null>(null)
    const [summaryTo, setSummaryTo] = useState<Date | null>(null)
    const [paymentsFrom, setPaymentsFrom] = useState<Date | null>(null)
    const [paymentsTo, setPaymentsTo] = useState<Date | null>(null)
    const [preview, setPreview] = useState<PreviewState | null>(null)

    const dateParams = (from: Date | null, to: Date | null): ReportParams => ({
        from: from ? dayjs(from).format('YYYY-MM-DD') : undefined,
        to: to ? dayjs(to).format('YYYY-MM-DD') : undefined,
    })

    const listParams = useMemo(
        (): ReportParams => ({
            status: listStatus || undefined,
            ...dateParams(listFrom, listTo),
        }),
        [listStatus, listFrom, listTo],
    )

    const summaryParams = useMemo(
        () => dateParams(summaryFrom, summaryTo),
        [summaryFrom, summaryTo],
    )

    const paymentsParams = useMemo(
        () => dateParams(paymentsFrom, paymentsTo),
        [paymentsFrom, paymentsTo],
    )

    const openPreview = (state: PreviewState) => setPreview(state)
    const closePreview = () => setPreview(null)

    return (
        <>
            <div className="flex flex-col gap-4">
                <PageHeader
                    title="Reportes e impresión"
                    subtitle="Reportes"
                    info="Genera el documento, revísalo en pantalla y descárgalo como PDF. Configura el logo en el panel de identidad (ícono de engranaje)."
                />

                <Card
                    bordered
                    className="border-slate-200/90 shadow-none dark:border-slate-700"
                    bodyClass="p-5"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <IconTile accent="sky" size="sm">
                            <HiOutlineClipboardList />
                        </IconTile>
                        <h6 className="mb-0 font-semibold text-slate-800 dark:text-slate-100">
                            Listado de trabajos
                        </h6>
                    </div>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Detalle de trabajos por estado y rango de fechas.
                    </p>
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Estado
                            </label>
                            <Select
                                options={statusFilterOptions}
                                value={statusFilterOptions.filter(
                                    (option) => option.value === listStatus,
                                )}
                                onChange={(option) =>
                                    setListStatus(
                                        (option as StatusOption | null)?.value || '',
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Desde
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha inicio"
                                value={listFrom}
                                onChange={setListFrom}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Hasta
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha fin"
                                value={listTo}
                                onChange={setListTo}
                            />
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            openPreview({
                                kind: 'works-list',
                                params: listParams,
                                filename: 'trabajos-listado.pdf',
                            })
                        }
                    >
                        Ver reporte
                    </Button>
                </Card>

                <Card
                    bordered
                    className="border-slate-200/90 shadow-none dark:border-slate-700"
                    bodyClass="p-5"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <IconTile accent="emerald" size="sm">
                            <HiOutlineDocumentText />
                        </IconTile>
                        <h6 className="mb-0 font-semibold text-slate-800 dark:text-slate-100">
                            Resumen por estado
                        </h6>
                    </div>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Totales agrupados: pendiente, terminado y no aceptado.
                    </p>
                    <div className="mb-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Desde
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha inicio"
                                value={summaryFrom}
                                onChange={setSummaryFrom}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Hasta
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha fin"
                                value={summaryTo}
                                onChange={setSummaryTo}
                            />
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            openPreview({
                                kind: 'works-summary',
                                params: summaryParams,
                                filename: 'trabajos-resumen.pdf',
                            })
                        }
                    >
                        Ver reporte
                    </Button>
                </Card>

                <Card
                    bordered
                    className="border-slate-200/90 shadow-none dark:border-slate-700"
                    bodyClass="p-5"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <IconTile accent="amber" size="sm">
                            <HiOutlineCash />
                        </IconTile>
                        <h6 className="mb-0 font-semibold text-slate-800 dark:text-slate-100">
                            Resumen de pagos
                        </h6>
                    </div>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Totales por método de pago en el rango de fechas.
                    </p>
                    <div className="mb-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Desde
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha inicio"
                                value={paymentsFrom}
                                onChange={setPaymentsFrom}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Hasta
                            </label>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha fin"
                                value={paymentsTo}
                                onChange={setPaymentsTo}
                            />
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            openPreview({
                                kind: 'payments-summary',
                                params: paymentsParams,
                                filename: 'pagos-resumen.pdf',
                            })
                        }
                    >
                        Ver reporte
                    </Button>
                </Card>

                <Card
                    bordered
                    className="border-slate-200/90 shadow-none dark:border-slate-700"
                    bodyClass="p-5"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <IconTile accent="violet" size="sm">
                            <HiOutlineUserGroup />
                        </IconTile>
                        <h6 className="mb-0 font-semibold text-slate-800 dark:text-slate-100">
                            Pacientes por fuente de referidos
                        </h6>
                    </div>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Conteo de pacientes por origen de referido, incluyendo sin fuente.
                    </p>
                    <Button
                        variant="solid"
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            openPreview({
                                kind: 'referrals-by-source',
                                filename: 'referidos-por-fuente.pdf',
                            })
                        }
                    >
                        Ver reporte
                    </Button>
                </Card>

                <Card
                    bordered
                    className="border-dashed border-slate-200/90 shadow-none dark:border-slate-700"
                    bodyClass="p-5"
                >
                    <h6 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
                        Documentos por paciente
                    </h6>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Cotización desde <strong>Plan de tratamiento</strong>, recibo
                        desde <strong>Pagos</strong> y receta desde{' '}
                        <strong>Recetas</strong>.
                    </p>
                </Card>
            </div>

            {preview && (
                <ReportPreviewModal
                    isOpen
                    onClose={closePreview}
                    kind={preview.kind}
                    params={preview.params}
                    downloadFilename={preview.filename}
                />
            )}
        </>
    )
}

export default ReportList
