import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineHome,
    HiOutlineKey,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import IconText from '@/components/shared/IconText'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Tag from '@/components/ui/Tag'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { useAppSelector } from '@/store'
import {
    AGENDA_READ,
    CATALOG_READ,
    PATIENTS_READ,
    ROLES_MANAGE,
} from '@/constants/roles.constant'
import { apiGetAppointments } from '@/services/AppointmentService'
import { apiGetPatientKpis } from '@/services/PatientService'
import type { PatientKpis } from '@/@types/patient'

type Shortcut = {
    title: string
    description: string
    path: string
    icon: React.ReactNode
    authority: string[]
}

type HomeKpiCardProps = {
    title: string
    value: number
    helper: string
    loading: boolean
}

const numberFormatter = new Intl.NumberFormat('es-SV')

const shortcuts: Shortcut[] = [
    {
        title: 'Pacientes',
        description: 'Padrón, fichas y datos de contacto',
        path: '/pacientes',
        icon: <HiOutlineUserGroup className="text-2xl" />,
        authority: [PATIENTS_READ],
    },
    {
        title: 'Agenda',
        description: 'Citas de la semana y estados',
        path: '/agenda',
        icon: <HiOutlineCalendar className="text-2xl" />,
        authority: [AGENDA_READ],
    },
    {
        title: 'Tratamientos',
        description: 'Catálogo, códigos y precios',
        path: '/tratamientos',
        icon: <HiOutlineClipboardList className="text-2xl" />,
        authority: [CATALOG_READ],
    },
    {
        title: 'Roles',
        description: 'Permisos por clínica',
        path: '/roles',
        icon: <HiOutlineKey className="text-2xl" />,
        authority: [ROLES_MANAGE],
    },
]

const canAccess = (userAuthority: string[], authority: string[]) => {
    if (authority.length === 0) {
        return true
    }
    if (userAuthority.includes('super_admin')) {
        return true
    }
    return authority.some((code) => userAuthority.includes(code))
}

const HomeKpiCard = ({ title, value, helper, loading }: HomeKpiCardProps) => (
    <Card bodyClass="p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {loading ? (
                <Skeleton height={28} width={60} />
            ) : (
                numberFormatter.format(value)
            )}
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helper}
        </div>
    </Card>
)

const Home = () => {
    const navigate = useNavigate()
    const { pageTitleTheme, textTheme } = useThemeClass()
    const clinicName =
        useAppSelector((state) => state.clinic.current?.name) || 'Dentura'
    const userName = useAppSelector((state) => state.auth.user.userName) || ''
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []

    const canReadPatients = canAccess(userAuthority, [PATIENTS_READ])
    const canReadAgenda = canAccess(userAuthority, [AGENDA_READ])

    const [kpiLoading, setKpiLoading] = useState(false)
    const [patientKpis, setPatientKpis] = useState<PatientKpis | null>(null)
    const [todayAppointments, setTodayAppointments] = useState(0)
    const [upcomingAppointments, setUpcomingAppointments] = useState(0)

    const visible = shortcuts.filter((item) =>
        canAccess(userAuthority, item.authority),
    )

    const loadDashboard = useCallback(async () => {
        if (!canReadPatients && !canReadAgenda) {
            return
        }
        setKpiLoading(true)
        try {
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
            }

            if (canReadAgenda) {
                const start = dayjs().startOf('day')
                const end = dayjs().endOf('day')
                const weekEnd = dayjs().add(7, 'day').endOf('day')
                tasks.push(
                    Promise.all([
                        apiGetAppointments(
                            start.toISOString(),
                            end.toISOString(),
                        ),
                        apiGetAppointments(
                            start.toISOString(),
                            weekEnd.toISOString(),
                        ),
                    ]).then(([today, week]) => {
                        setTodayAppointments(today.data.length)
                        setUpcomingAppointments(week.data.length)
                    }),
                )
            }

            await Promise.all(tasks)
        } catch {
            // Keep shortcuts usable even if indicators fail.
        } finally {
            setKpiLoading(false)
        }
    }, [canReadAgenda, canReadPatients])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const greeting = userName
        ? `Hola, ${userName}`
        : 'Panel operativo de la clínica'

    return (
        <div>
            <div className="mb-6">
                <div className="rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="lg:flex items-start justify-between gap-4">
                        <div>
                            <IconText
                                className={`text-lg font-semibold mb-1 ${pageTitleTheme}`}
                                icon={
                                    <HiOutlineHome
                                        className={`text-xl ${textTheme}`}
                                    />
                                }
                            >
                                {clinicName}
                            </IconText>
                            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
                                {greeting}. Accesos rápidos y resumen del día
                                para priorizar recepción, agenda y seguimiento.
                            </p>
                        </div>
                        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
                            <Tag className="border-0 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                                {dayjs().format('dddd D MMM YYYY')}
                            </Tag>
                        </div>
                    </div>
                </div>
            </div>

            {(canReadPatients || canReadAgenda) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {canReadPatients && (
                        <>
                            <HomeKpiCard
                                title="Pacientes totales"
                                value={patientKpis?.totalPatients ?? 0}
                                helper="Base de la clínica"
                                loading={kpiLoading}
                            />
                            <HomeKpiCard
                                title="Nuevos este mes"
                                value={patientKpis?.newPatientsThisMonth ?? 0}
                                helper="Altas del mes en curso"
                                loading={kpiLoading}
                            />
                        </>
                    )}
                    {canReadAgenda && (
                        <>
                            <HomeKpiCard
                                title="Citas de hoy"
                                value={todayAppointments}
                                helper="Agenda del día"
                                loading={kpiLoading}
                            />
                            <HomeKpiCard
                                title="Próximos 7 días"
                                value={upcomingAppointments}
                                helper="Citas programadas"
                                loading={kpiLoading}
                            />
                        </>
                    )}
                    {canReadPatients && !canReadAgenda && (
                        <>
                            <HomeKpiCard
                                title="Con cita próxima"
                                value={
                                    patientKpis?.patientsWithUpcomingAppointment ??
                                    0
                                }
                                helper={`En ${patientKpis?.upcomingDays ?? 7} días`}
                                loading={kpiLoading}
                            />
                            <HomeKpiCard
                                title="Pacientes inactivos"
                                value={patientKpis?.inactivePatients ?? 0}
                                helper={`Sin citas en ${patientKpis?.inactivityDays ?? 90} días`}
                                loading={kpiLoading}
                            />
                        </>
                    )}
                </div>
            )}

            <div className="mb-3">
                <h5 className={`mb-1 ${pageTitleTheme}`}>Accesos rápidos</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Entra a los módulos disponibles según tus permisos.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {visible.map((item) => (
                    <Card
                        key={item.path}
                        clickable
                        className="hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                        bodyClass="p-5"
                        onClick={() => navigate(item.path)}
                    >
                        <div
                            className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 ${textTheme}`}
                        >
                            {item.icon}
                        </div>
                        <div className="mb-1 font-semibold text-base text-gray-900 dark:text-gray-100">
                            {item.title}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default Home
