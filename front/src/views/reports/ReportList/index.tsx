import { useState } from 'react'
import dayjs from 'dayjs'
import {
    HiOutlineClipboardList,
    HiOutlineDocumentDownload,
    HiOutlineDocumentText,
} from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import IconText from '@/components/shared/IconText'
import {
    Button,
    DatePicker,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import { workStatusOptions } from '@/views/patients/works.constants'
import {
    downloadWorksListPdf,
    downloadWorksSummaryPdf,
} from '@/services/ReportService'
import { getApiErrorMessage } from '@/services/PatientService'
import useThemeClass from '@/utils/hooks/useThemeClass'

type StatusOption = { value: string; label: string }

const statusFilterOptions: StatusOption[] = [
    { value: '', label: 'Todos los estados' },
    ...workStatusOptions,
]

const ReportList = () => {
    const { pageTitleTheme } = useThemeClass()
    const [listStatus, setListStatus] = useState('')
    const [listFrom, setListFrom] = useState<Date | null>(null)
    const [listTo, setListTo] = useState<Date | null>(null)
    const [summaryFrom, setSummaryFrom] = useState<Date | null>(null)
    const [summaryTo, setSummaryTo] = useState<Date | null>(null)
    const [downloading, setDownloading] = useState<string | null>(null)

    const dateParams = (from: Date | null, to: Date | null) => ({
        from: from ? dayjs(from).format('YYYY-MM-DD') : undefined,
        to: to ? dayjs(to).format('YYYY-MM-DD') : undefined,
    })

    const runDownload = async (
        key: string,
        action: () => Promise<void>,
        success: string,
    ) => {
        setDownloading(key)
        try {
            await action()
            toast.push(
                <Notification type="success" title="PDF generado">
                    {success}
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo generar el PDF">
                    {getApiErrorMessage(error, 'Intenta de nuevo')}
                </Notification>,
            )
        } finally {
            setDownloading(null)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <AdaptableCard bodyClass="p-5">
                <IconText
                    className={`text-lg font-semibold mb-1 ${pageTitleTheme}`}
                    icon={<HiOutlineDocumentText className="text-xl" />}
                >
                    Reportes e impresión
                </IconText>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Los PDF se generan en el servidor con el logo y datos de tu
                    clínica. Configura el logo en el panel de identidad (ícono
                    de engranaje).
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
                    icon={<HiOutlineDocumentDownload />}
                    loading={downloading === 'list'}
                    onClick={() =>
                        runDownload(
                            'list',
                            () =>
                                downloadWorksListPdf({
                                    status: listStatus || undefined,
                                    ...dateParams(listFrom, listTo),
                                }),
                            'Se descargó el listado de trabajos.',
                        )
                    }
                >
                    Descargar PDF
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
                    icon={<HiOutlineDocumentDownload />}
                    loading={downloading === 'summary'}
                    onClick={() =>
                        runDownload(
                            'summary',
                            () =>
                                downloadWorksSummaryPdf(
                                    dateParams(summaryFrom, summaryTo),
                                ),
                            'Se descargó el resumen por estado.',
                        )
                    }
                >
                    Descargar PDF
                </Button>
            </AdaptableCard>

            <AdaptableCard bodyClass="p-5">
                <h6 className="font-semibold mb-1">Cotización por paciente</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Descarga la cotización del plan de tratamiento desde la ficha
                    del paciente, pestaña <strong>Plan de tratamiento</strong>.
                </p>
            </AdaptableCard>
        </div>
    )
}

export default ReportList
