import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
    HiOutlineClipboardList,
    HiOutlineDocumentText,
    HiOutlineEye,
} from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import IconText from '@/components/shared/IconText'
import ReportPreviewModal from '@/components/reports/ReportPreviewModal'
import type { ReportPreviewKind } from '@/components/reports/ReportPreviewModal'
import {
    Button,
    DatePicker,
    Select,
} from '@/components/ui'
import { workStatusOptions } from '@/views/patients/works.constants'
import type { ReportParams } from '@/services/ReportService'
import useThemeClass from '@/utils/hooks/useThemeClass'

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
    const { pageTitleTheme } = useThemeClass()
    const [listStatus, setListStatus] = useState('')
    const [listFrom, setListFrom] = useState<Date | null>(null)
    const [listTo, setListTo] = useState<Date | null>(null)
    const [summaryFrom, setSummaryFrom] = useState<Date | null>(null)
    const [summaryTo, setSummaryTo] = useState<Date | null>(null)
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

    const openPreview = (state: PreviewState) => setPreview(state)
    const closePreview = () => setPreview(null)

    return (
        <>
            <div className="flex flex-col gap-4">
                <AdaptableCard bodyClass="p-5">
                    <IconText
                        className={`text-lg font-semibold mb-1 ${pageTitleTheme}`}
                        icon={<HiOutlineDocumentText className="text-xl" />}
                    >
                        Reportes e impresión
                    </IconText>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Genera el documento, revísalo en pantalla y descárgalo como PDF.
                        Configura el logo en el panel de identidad (ícono de engranaje).
                    </p>
                </AdaptableCard>

                <AdaptableCard bodyClass="p-5">
                    <IconText
                        className="mb-4 text-base font-semibold"
                        icon={<HiOutlineClipboardList className="text-lg text-sky-600" />}
                    >
                        Listado de trabajos
                    </IconText>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Detalle de trabajos por estado y rango de fechas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">Estado</div>
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
                            <div className="mb-1.5 text-sm font-semibold">Desde</div>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha inicio"
                                value={listFrom}
                                onChange={setListFrom}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">Hasta</div>
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
                </AdaptableCard>

                <AdaptableCard bodyClass="p-5">
                    <IconText
                        className="mb-4 text-base font-semibold"
                        icon={<HiOutlineDocumentText className="text-lg text-emerald-600" />}
                    >
                        Resumen por estado
                    </IconText>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Totales agrupados: pendiente, terminado y no aceptado.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-w-2xl">
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">Desde</div>
                            <DatePicker
                                inputFormat="DD/MM/YYYY"
                                placeholder="Fecha inicio"
                                value={summaryFrom}
                                onChange={setSummaryFrom}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">Hasta</div>
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
                </AdaptableCard>

                <AdaptableCard bodyClass="p-5">
                    <h6 className="font-semibold mb-1">Cotización por paciente</h6>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Abre la cotización desde la ficha del paciente, pestaña{' '}
                        <strong>Plan de tratamiento</strong>.
                    </p>
                </AdaptableCard>
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
