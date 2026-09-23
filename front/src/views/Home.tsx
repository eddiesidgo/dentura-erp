import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { ApexOptions } from 'apexcharts'
import {
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlinePlus,
    HiOutlineUserAdd,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import Chart from '@/components/shared/Chart'
import GhostButton from '@/components/shared/GhostButton'
import KpiStat from '@/components/shared/KpiStat'
import SoftCard from '@/components/shared/SoftCard'
import { Button, Spinner } from '@/components/ui'
import { useConfig } from '@/components/ui/ConfigProvider'
import { useAppSelector } from '@/store'
import {
    AGENDA_READ,
    AGENDA_WRITE,
    CATALOG_READ,
    PATIENTS_READ,
    PATIENTS_WRITE,
} from '@/constants/roles.constant'
import { COLORS } from '@/constants/chart.constant'
import { apiGetAppointments } from '@/services/AppointmentService'
import { apiGetPatientKpis } from '@/services/PatientService'
import type { Appointment, AppointmentStatus } from '@/@types/appointment'
import type { PatientKpis } from '@/@types/patient'
import { statusOptions } from '@/views/agenda/constants'
import useAuthority from '@/utils/hooks/useAuthority'

const formatNumber = (value: number) =>
    new Intl.NumberFormat('es-SV').format(value)

const formatPercent = (value: number) =>
    `${value.toFixed(1).replace('.', ',')}%`

const STATUS_CHART_COLORS: Record<AppointmentStatus, string> = {
    SCHEDULED: COLORS[1],
    CONFIRMED: COLORS[2],
    COMPLETED: COLORS[0],
    CANCELLED: COLORS[4],
    NO_SHOW: COLORS[3],
}

const KpiTile = ({
    label,
    value,
    hint,
    accent,
}: {
    label: string
    value: number
    hint?: string
    accent: 'sky' | 'amber' | 'emerald' | 'indigo' | 'slate'
}) => (
    <KpiStat
        label={label}
        value={formatNumber(value)}
        sublabel={hint}
        accent={accent}
    />
)

const canAccess = (userAuthority: string[], authority: string[]) => {
    if (authority.length === 0) {
        return true
    }
    if (userAuthority.includes('super_admin')) {
        return true
    }
    return authority.some((code) => userAuthority.includes(code))
}

const THEME_BAR_COLORS: Record<string, string> = {
    red: '#dc2626',
    orange: '#ea580c',
    amber: '#d97706',
    yellow: '#ca8a04',
    lime: '#65a30d',
    green: '#16a34a',
    emerald: '#059669',
    teal: '#0d9488',
    cyan: '#0891b2',
    sky: '#0284c7',
    blue: '#2563eb',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    purple: '#9333ea',
    fuchsia: '#c026d3',
    pink: '#db2777',
    rose: '#e11d48',
}

const Home = () => {
    const navigate = useNavigate()
    const { themeColor } = useConfig()
    const userName = useAppSelector((state) => state.auth.user.userName)
    const clinicName =
        useAppSelector((state) => state.clinic.current?.name) || 'Dentura'
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []

    const canReadPatients = canAccess(userAuthority, [PATIENTS_READ])
    const canWritePatients = useAuthority(userAuthority, [PATIENTS_WRITE])
    const canReadAgenda = canAccess(userAuthority, [AGENDA_READ])
    const canWriteAgenda = useAuthority(userAuthority, [AGENDA_WRITE])
    const canReadCatalog = canAccess(userAuthority, [CATALOG_READ])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [patientKpis, setPatientKpis] = useState<PatientKpis | null>(null)
    const [appointmentsYear, setAppointmentsYear] = useState<Appointment[]>([])
    const [todayCount, setTodayCount] = useState(0)
    const [weekCount, setWeekCount] = useState(0)

    const loadDashboard = useCallback(async () => {
        if (!canReadPatients && !canReadAgenda) {
            setLoading(false)
            setPatientKpis(null)
            setAppointmentsYear([])
            setTodayCount(0)
            setWeekCount(0)
            setError('')
            return
        }

        setLoading(true)
        setError('')
        try {
            const yearStart = dayjs().subtract(11, 'month').startOf('month')
            const yearEnd = dayjs().endOf('month')
            const todayStart = dayjs().startOf('day')
            const todayEnd = dayjs().endOf('day')
            const weekEnd = dayjs().add(7, 'day').endOf('day')

            const tasks: Promise<void>[] = []

            if (canReadPatients) {
                tasks.push(
                    apiGetPatientKpis({
                        upcomingDays: 7,
                        inactivityDays: 90,
                    }).then((response) => {
                        setPatientKpis(response.data)
                    }),
                )
            } else {
                setPatientKpis(null)
            }

            if (canReadAgenda) {
                tasks.push(
                    Promise.all([
                        apiGetAppointments(
                            yearStart.toISOString(),
                            yearEnd.toISOString(),
                        ),
                        apiGetAppointments(
                            todayStart.toISOString(),
                            todayEnd.toISOString(),
                        ),
                        apiGetAppointments(
                            todayStart.toISOString(),
                            weekEnd.toISOString(),
                        ),
                    ]).then(([year, today, week]) => {
                        setAppointmentsYear(year.data)
                        setTodayCount(today.data.length)
                        setWeekCount(week.data.length)
                    }),
                )
            } else {
                setAppointmentsYear([])
                setTodayCount(0)
                setWeekCount(0)
            }

            await Promise.all(tasks)
        } catch {
            setError('No se pudo cargar el panel de inicio')
            setPatientKpis(null)
            setAppointmentsYear([])
            setTodayCount(0)
            setWeekCount(0)
        } finally {
            setLoading(false)
        }
    }, [canReadAgenda, canReadPatients])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const monthlyBuckets = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, index) =>
            dayjs().subtract(11 - index, 'month').startOf('month'),
        )
        return months.map((month) => {
            const key = month.format('YYYY-MM')
            const total = appointmentsYear.filter(
                (appointment) =>
                    dayjs(appointment.startAt).format('YYYY-MM') === key,
            ).length
            return {
                label: month.format('MMM YY'),
                total,
            }
        })
    }, [appointmentsYear])

    const monthlyLabels = useMemo(
        () => monthlyBuckets.map((month) => month.label),
        [monthlyBuckets],
    )
    const monthlySeries = useMemo(
        () => [
            {
                name: 'Citas',
                data: monthlyBuckets.map((month) => month.total),
            },
        ],
        [monthlyBuckets],
    )
    const hasMonthlyData = useMemo(
        () => monthlyBuckets.some((month) => month.total > 0),
        [monthlyBuckets],
    )

    const statusDistribution = useMemo(() => {
        const counts = new Map<AppointmentStatus, number>()
        for (const appointment of appointmentsYear) {
            counts.set(
                appointment.status,
                (counts.get(appointment.status) || 0) + 1,
            )
        }
        const total = appointmentsYear.length || 1
        return statusOptions
            .map((option) => {
                const value = option.value as AppointmentStatus
                const count = counts.get(value) || 0
                return {
                    label: option.label,
                    total: count,
                    porcentaje: (count / total) * 100,
                    color: STATUS_CHART_COLORS[value],
                }
            })
            .filter((item) => item.total > 0)
    }, [appointmentsYear])

    const statusValues = statusDistribution.map((item) => item.total)
    const hasStatusData = statusValues.length > 0

    const primaryBarColor = THEME_BAR_COLORS[themeColor] || COLORS[0]

    const barOptions = useMemo<ApexOptions>(
        () => ({
            colors: [primaryBarColor],
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    borderRadius: 4,
                },
            },
            yaxis: {
                labels: {
                    formatter: (val) => `${Math.round(val)}`,
                },
            },
            tooltip: {
                y: {
                    formatter: (val) => `${val}`,
                },
            },
        }),
        [primaryBarColor],
    )

    const donutOptions = useMemo<ApexOptions>(
        () => ({
            labels: statusDistribution.map((item) => item.label),
            colors: statusDistribution.map((item) => item.color),
            legend: { show: false },
        }),
        [statusDistribution],
    )

    const sinDatos =
        !loading &&
        !error &&
        (patientKpis?.totalPatients ?? 0) === 0 &&
        appointmentsYear.length === 0

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <SoftCard>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                </div>
            </SoftCard>
        )
    }

    return (
        <div className="space-y-6">
            {sinDatos ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="font-semibold">
                        Aún no hay actividad registrada en esta clínica.
                    </p>
                    <p className="mt-1 text-amber-800 dark:text-amber-200">
                        Registra un paciente o crea una cita para empezar a ver
                        métricas aquí.
                    </p>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="space-y-6 lg:col-span-1">
                    <SoftCard>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {userName
                                ? `Bienvenido, ${userName}`
                                : 'Bienvenido'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Resumen operativo de {clinicName} con datos en
                            tiempo real.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {canReadPatients ? (
                                <>
                                    <KpiTile
                                        label="Pacientes"
                                        value={patientKpis?.totalPatients ?? 0}
                                        accent="indigo"
                                    />
                                    <KpiTile
                                        label="Nuevos mes"
                                        value={
                                            patientKpis?.newPatientsThisMonth ??
                                            0
                                        }
                                        accent="sky"
                                    />
                                </>
                            ) : null}
                            {canReadAgenda ? (
                                <>
                                    <KpiTile
                                        label="Citas hoy"
                                        value={todayCount}
                                        accent="emerald"
                                    />
                                    <KpiTile
                                        label="Próx. 7 días"
                                        value={weekCount}
                                        hint="Incluye hoy"
                                        accent="amber"
                                    />
                                </>
                            ) : null}
                            {canReadPatients && !canReadAgenda ? (
                                <>
                                    <KpiTile
                                        label="Con cita"
                                        value={
                                            patientKpis?.patientsWithUpcomingAppointment ??
                                            0
                                        }
                                        hint={`En ${patientKpis?.upcomingDays ?? 7} días`}
                                        accent="emerald"
                                    />
                                    <KpiTile
                                        label="Inactivos"
                                        value={
                                            patientKpis?.inactivePatients ?? 0
                                        }
                                        hint={`${patientKpis?.inactivityDays ?? 90} días`}
                                        accent="slate"
                                    />
                                </>
                            ) : null}
                        </div>
                    </SoftCard>

                    <SoftCard>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Operación hoy
                        </h4>
                        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            {canReadAgenda ? (
                                <>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40">
                                        <span>Citas del día</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            {formatNumber(todayCount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40">
                                        <span>Próximos 7 días</span>
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            {formatNumber(weekCount)}
                                        </span>
                                    </div>
                                </>
                            ) : null}
                            {canReadPatients ? (
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40">
                                    <span>Pacientes inactivos</span>
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                                        {formatNumber(
                                            patientKpis?.inactivePatients ?? 0,
                                        )}
                                    </span>
                                </div>
                            ) : null}
                            {!canReadPatients && !canReadAgenda ? (
                                <p className="text-gray-500 dark:text-gray-400">
                                    Sin indicadores para tu rol.
                                </p>
                            ) : null}
                        </div>
                    </SoftCard>

                    <SoftCard>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Acciones rápidas
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {canWriteAgenda ? (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<HiOutlineCalendar />}
                                    onClick={() => navigate('/agenda')}
                                >
                                    Nueva cita
                                </Button>
                            ) : null}
                            {canWritePatients ? (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="emerald-600"
                                    icon={<HiOutlineUserAdd />}
                                    onClick={() => navigate('/pacientes/nuevo')}
                                >
                                    Nuevo paciente
                                </Button>
                            ) : null}
                            {canReadPatients ? (
                                <GhostButton
                                    size="sm"
                                    icon={<HiOutlineUserGroup />}
                                    onClick={() => navigate('/pacientes')}
                                >
                                    Pacientes
                                </GhostButton>
                            ) : null}
                            {canReadCatalog ? (
                                <GhostButton
                                    size="sm"
                                    icon={<HiOutlineClipboardList />}
                                    onClick={() => navigate('/tratamientos')}
                                >
                                    Tratamientos
                                </GhostButton>
                            ) : null}
                            {canReadAgenda && !canWriteAgenda ? (
                                <GhostButton
                                    size="sm"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => navigate('/agenda')}
                                >
                                    Ver agenda
                                </GhostButton>
                            ) : null}
                        </div>
                    </SoftCard>
                </div>

                <div className="space-y-6 lg:col-span-3">
                    <SoftCard>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Actividad (últimos 12 meses)
                                </h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Citas registradas en la agenda por mes
                                </p>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {dayjs().format('D MMM YYYY, HH:mm')}
                            </div>
                        </div>
                        <div className="mt-4">
                            {!canReadAgenda ? (
                                <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Necesitas permiso de agenda para ver este
                                    gráfico.
                                </p>
                            ) : hasMonthlyData ? (
                                <Chart
                                    type="bar"
                                    series={monthlySeries}
                                    xAxis={monthlyLabels}
                                    height={288}
                                    customOptions={barOptions}
                                />
                            ) : (
                                <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Todavía no hay citas mensuales para
                                    graficar.
                                </p>
                            )}
                        </div>
                    </SoftCard>

                    <SoftCard>
                        <div>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                Distribución por estado de cita
                            </h4>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Basada en las citas de los últimos 12 meses
                            </p>
                        </div>
                        {!canReadAgenda ? (
                            <p className="mt-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Necesitas permiso de agenda para ver esta
                                distribución.
                            </p>
                        ) : hasStatusData ? (
                            <div className="mt-4 grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                                <Chart
                                    type="donut"
                                    series={statusValues}
                                    height={256}
                                    customOptions={donutOptions}
                                    donutTitle="Total"
                                    donutText={String(
                                        statusValues.reduce(
                                            (sum, value) => sum + value,
                                            0,
                                        ),
                                    )}
                                />
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    {statusDistribution.map((item) => (
                                        <li
                                            key={item.label}
                                            className="flex items-center gap-2"
                                        >
                                            <span
                                                className="inline-block h-3 w-3 rounded"
                                                style={{
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                            <span className="font-medium text-gray-800 dark:text-gray-100">
                                                {item.label}
                                            </span>
                                            <span>
                                                {formatPercent(item.porcentaje)}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-500">
                                                ({formatNumber(item.total)})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="mt-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Crea citas en la agenda para ver la
                                distribución por estado.
                            </p>
                        )}
                    </SoftCard>
                </div>
            </div>
        </div>
    )
}

export default Home
