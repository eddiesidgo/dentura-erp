import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import DataTable from '@/components/shared/DataTable'
import PageHeader from '@/components/shared/PageHeader'
import {
    Button,
    DatePicker,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineRefresh } from 'react-icons/hi'
import { WORKS_READ } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { getApiErrorMessage } from '@/services/PatientService'
import { apiGetPatients } from '@/services/PatientService'
import { apiGetTreatments } from '@/services/TreatmentService'
import {
    apiGetWorks,
    apiGetWorksSummaryByTreatment,
} from '@/services/WorkService'
import {
    formatMoney,
    workStatusClass,
    workStatusLabel,
    workStatusOptions,
} from '@/views/patients/works.constants'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Work, WorkTreatmentSummary } from '@/@types/work'
import type { Patient } from '@/@types/patient'
import type { Treatment } from '@/@types/treatment'

type Option = { value: number | string; label: string }

const statusFilterOptions: Option[] = [
    { value: '', label: 'Todos los estados' },
    ...workStatusOptions,
]

type ViewMode = 'detail' | 'by-treatment'

const WorkList = () => {
    const { textTheme } = useThemeClass()
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canRead = useAuthority(userAuthority, [WORKS_READ])

    const [viewMode, setViewMode] = useState<ViewMode>('detail')
    const [works, setWorks] = useState<Work[]>([])
    const [summaries, setSummaries] = useState<WorkTreatmentSummary[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [treatments, setTreatments] = useState<Treatment[]>([])
    const [loading, setLoading] = useState(false)
    const [patientId, setPatientId] = useState<number | ''>('')
    const [treatmentId, setTreatmentId] = useState<number | ''>('')
    const [status, setStatus] = useState('')
    const [from, setFrom] = useState<Date | null>(null)
    const [to, setTo] = useState<Date | null>(null)

    const patientOptions: Option[] = useMemo(
        () => [
            { value: '', label: 'Todos los pacientes' },
            ...patients.map((patient) => ({
                value: patient.id,
                label: `${patient.recordNumber} · ${patient.firstName} ${patient.lastName}`,
            })),
        ],
        [patients],
    )

    const treatmentOptions: Option[] = useMemo(
        () => [
            { value: '', label: 'Todos los tratamientos' },
            ...treatments.map((treatment) => ({
                value: treatment.id,
                label: `${treatment.code} · ${treatment.name}`,
            })),
        ],
        [treatments],
    )

    const filterParams = useMemo(
        () => ({
            patientId: patientId === '' ? undefined : Number(patientId),
            treatmentId:
                viewMode === 'detail' && treatmentId !== ''
                    ? Number(treatmentId)
                    : undefined,
            status: status || undefined,
            from: from ? dayjs(from).format('YYYY-MM-DD') : undefined,
            to: to ? dayjs(to).format('YYYY-MM-DD') : undefined,
        }),
        [patientId, treatmentId, status, from, to, viewMode],
    )

    const loadLookups = useCallback(async () => {
        try {
            const [patientsRes, treatmentsRes] = await Promise.all([
                apiGetPatients({ page: 1, size: 200, active: true }),
                apiGetTreatments({ page: 1, size: 200, active: true }),
            ])
            setPatients(patientsRes.data.data)
            setTreatments(treatmentsRes.data.data)
        } catch {
            setPatients([])
            setTreatments([])
        }
    }, [])

    const loadData = useCallback(async () => {
        if (!canRead) {
            return
        }
        setLoading(true)
        try {
            if (viewMode === 'detail') {
                const { data } = await apiGetWorks(filterParams)
                setWorks(data)
            } else {
                const { data } = await apiGetWorksSummaryByTreatment({
                    patientId: filterParams.patientId,
                    status: filterParams.status,
                    from: filterParams.from,
                    to: filterParams.to,
                })
                setSummaries(data)
            }
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener el listado de trabajos',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [canRead, filterParams, viewMode])

    useEffect(() => {
        loadLookups()
    }, [loadLookups, clinicId])

    useEffect(() => {
        loadData()
    }, [loadData, clinicId])

    const totals = useMemo(() => {
        if (viewMode === 'detail') {
            const amount = works.reduce((sum, work) => sum + Number(work.total), 0)
            const qty = works.reduce((sum, work) => sum + work.quantity, 0)
            return { rows: works.length, qty, amount }
        }
        const amount = summaries.reduce(
            (sum, row) => sum + Number(row.amountTotal),
            0,
        )
        const qty = summaries.reduce((sum, row) => sum + row.quantityTotal, 0)
        return { rows: summaries.length, qty, amount }
    }, [viewMode, works, summaries])

    const detailColumns: ColumnDef<Work>[] = useMemo(
        () => [
            {
                header: 'Fecha',
                accessorKey: 'createdAt',
                cell: (props) =>
                    dayjs(props.row.original.createdAt).format('DD/MM/YYYY'),
            },
            {
                header: 'Paciente',
                accessorKey: 'patientName',
                cell: (props) => {
                    const work = props.row.original
                    return (
                        <div>
                            <Link
                                to={`/pacientes/${work.patientId}`}
                                className={`font-semibold hover:underline ${textTheme}`}
                            >
                                {work.patientName || `Paciente #${work.patientId}`}
                            </Link>
                            <div className="text-xs text-gray-500">
                                Exp. {work.recordNumber || '—'}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Tratamiento',
                accessorKey: 'treatmentCode',
                cell: (props) => {
                    const work = props.row.original
                    return (
                        <div>
                            <div className="font-semibold">{work.treatmentCode}</div>
                            <div className="text-xs text-gray-500">
                                {work.treatmentName}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Estado',
                accessorKey: 'status',
                cell: (props) => (
                    <Tag className={workStatusClass[props.row.original.status]}>
                        {workStatusLabel(props.row.original.status)}
                    </Tag>
                ),
            },
            {
                header: 'Pieza',
                accessorKey: 'tooth',
                cell: (props) => props.row.original.tooth || '—',
            },
            {
                header: 'Cant.',
                accessorKey: 'quantity',
            },
            {
                header: 'Total',
                accessorKey: 'total',
                cell: (props) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(Number(props.row.original.total))}
                    </span>
                ),
            },
        ],
        [textTheme],
    )

    const summaryColumns: ColumnDef<WorkTreatmentSummary>[] = useMemo(
        () => [
            {
                header: 'Tratamiento',
                accessorKey: 'treatmentCode',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div>
                            <div className="font-semibold">{row.treatmentCode}</div>
                            <div className="text-xs text-gray-500">
                                {row.treatmentName}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Trabajos',
                accessorKey: 'totalWorks',
            },
            {
                header: 'Terminados',
                accessorKey: 'completedCount',
                cell: (props) => (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {props.row.original.completedCount}
                    </span>
                ),
            },
            {
                header: 'Pendientes',
                accessorKey: 'pendingCount',
            },
            {
                header: 'No aceptados',
                accessorKey: 'rejectedCount',
            },
            {
                header: 'Cantidad',
                accessorKey: 'quantityTotal',
            },
            {
                header: 'Monto total',
                accessorKey: 'amountTotal',
                cell: (props) => formatMoney(Number(props.row.original.amountTotal)),
            },
            {
                header: 'Monto terminado',
                accessorKey: 'completedAmount',
                cell: (props) =>
                    formatMoney(Number(props.row.original.completedAmount)),
            },
        ],
        [],
    )

    if (!canRead) {
        return (
            <AdaptableCard bodyClass="p-8 text-center text-gray-500">
                No tienes permiso para ver el listado de trabajos.
            </AdaptableCard>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Listado de trabajos"
                subtitle="Operaciones"
                info="Consulta trabajos por paciente, tratamiento, estado y fechas (detalle o resumen por código de tratamiento)."
                extra={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={viewMode === 'detail' ? 'solid' : 'default'}
                            onClick={() => setViewMode('detail')}
                        >
                            Detalle
                        </Button>
                        <Button
                            size="sm"
                            variant={
                                viewMode === 'by-treatment' ? 'solid' : 'default'
                            }
                            onClick={() => setViewMode('by-treatment')}
                        >
                            Por tratamiento
                        </Button>
                        <Button
                            size="sm"
                            icon={<HiOutlineRefresh />}
                            onClick={loadData}
                        >
                            Actualizar
                        </Button>
                    </div>
                }
            />
            <AdaptableCard bodyClass="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Paciente</div>
                        <Select
                            options={patientOptions}
                            value={patientOptions.filter(
                                (option) => option.value === patientId,
                            )}
                            onChange={(option) =>
                                setPatientId(
                                    ((option as Option | null)?.value ??
                                        '') as number | '',
                                )
                            }
                        />
                    </div>
                    {viewMode === 'detail' && (
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">
                                Tratamiento
                            </div>
                            <Select
                                options={treatmentOptions}
                                value={treatmentOptions.filter(
                                    (option) => option.value === treatmentId,
                                )}
                                onChange={(option) =>
                                    setTreatmentId(
                                        ((option as Option | null)?.value ??
                                            '') as number | '',
                                    )
                                }
                            />
                        </div>
                    )}
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Estado</div>
                        <Select
                            options={statusFilterOptions}
                            value={statusFilterOptions.filter(
                                (option) => option.value === status,
                            )}
                            onChange={(option) =>
                                setStatus(
                                    String(
                                        (option as Option | null)?.value ?? '',
                                    ),
                                )
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Desde</div>
                        <DatePicker
                            inputFormat="DD/MM/YYYY"
                            placeholder="Fecha inicio"
                            value={from}
                            onChange={setFrom}
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Hasta</div>
                        <DatePicker
                            inputFormat="DD/MM/YYYY"
                            placeholder="Fecha fin"
                            value={to}
                            onChange={setTo}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-4 text-sm">
                    <Tag className="border-0 bg-gray-100 dark:bg-gray-700">
                        {totals.rows} registro{totals.rows === 1 ? '' : 's'}
                    </Tag>
                    <Tag className="border-0 bg-sky-50 text-sky-800 dark:bg-sky-500/20 dark:text-sky-100">
                        Cantidad: {totals.qty}
                    </Tag>
                    <Tag className="border-0 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
                        Total: {formatMoney(totals.amount)}
                    </Tag>
                </div>

                {viewMode === 'detail' ? (
                    <DataTable
                        columns={detailColumns}
                        data={works}
                        loading={loading}
                        pagingData={{
                            total: works.length,
                            pageIndex: 1,
                            pageSize: works.length || 10,
                        }}
                    />
                ) : (
                    <DataTable
                        columns={summaryColumns}
                        data={summaries}
                        loading={loading}
                        pagingData={{
                            total: summaries.length,
                            pageIndex: 1,
                            pageSize: summaries.length || 10,
                        }}
                    />
                )}
            </AdaptableCard>
        </div>
    )
}

export default WorkList
