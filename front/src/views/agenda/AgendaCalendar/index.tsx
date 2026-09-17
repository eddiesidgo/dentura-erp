import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import esLocale from '@fullcalendar/core/locales/es'
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import AdaptableCard from '@/components/shared/AdaptableCard'
import CalendarView from '@/components/shared/CalendarView'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PageHeader from '@/components/shared/PageHeader'
import { Button, Notification, Select, Tag, toast } from '@/components/ui'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import { HiPlusCircle } from 'react-icons/hi'
import {
    apiCreateAppointment,
    apiDeleteAppointment,
    apiGetAppointments,
    apiGetProviders,
    apiGetRooms,
    apiUpdateAppointment,
} from '@/services/AppointmentService'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    AGENDA_DELETE,
    AGENDA_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import AppointmentDrawer, {
    type AppointmentForm,
} from './AppointmentDrawer'
import { statusColor, statusOptions, statusTagClass } from '../constants'
import type {
    Appointment,
    AppointmentStatus,
    Provider,
    Room,
} from '@/@types/appointment'

const emptyForm: AppointmentForm = {
    start: null,
    end: null,
    status: 'SCHEDULED',
    reason: '',
    notes: '',
    roomId: null,
}

const toIso = (date: Date) => date.toISOString()

const shortName = (name?: string | null) => {
    if (!name) {
        return ''
    }
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
        return parts[0]
    }
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

const AgendaCalendar = () => {
    const navigate = useNavigate()
    const userAuthority = useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [AGENDA_WRITE])
    const canDelete = useAuthority(userAuthority, [AGENDA_DELETE])
    const clinicId = useAppSelector((state) => state.clinic.current?.id)

    const [events, setEvents] = useState<
        {
            id: string
            title: string
            start: string
            end: string
            backgroundColor?: string
            borderColor?: string
            extendedProps: { eventColor: string; appointment: Appointment }
        }[]
    >([])
    const [range, setRange] = useState<{ from: string; to: string } | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [form, setForm] = useState<AppointmentForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<AppointmentForm | null>(null)
    const [providers, setProviders] = useState<Provider[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [filterProviderId, setFilterProviderId] = useState<number | undefined>()
    const [filterRoomId, setFilterRoomId] = useState<number | undefined>()

    useEffect(() => {
        let cancelled = false
        const loadFilters = async () => {
            try {
                const [providersRes, roomsRes] = await Promise.all([
                    apiGetProviders(true),
                    apiGetRooms(true),
                ])
                if (!cancelled) {
                    setProviders(providersRes.data)
                    setRooms(roomsRes.data)
                }
            } catch {
                if (!cancelled) {
                    setProviders([])
                    setRooms([])
                }
            }
        }
        loadFilters()
        return () => {
            cancelled = true
        }
    }, [clinicId])

    const load = useCallback(
        async (from: string, to: string) => {
            try {
                const { data } = await apiGetAppointments(from, to, {
                    providerId: filterProviderId,
                    roomId: filterRoomId,
                })
                setEvents(
                    data.map((appointment) => {
                        const providerLabel = shortName(appointment.providerName)
                        const title = providerLabel
                            ? `${appointment.patientName} · ${providerLabel}`
                            : appointment.patientName
                        return {
                            id: String(appointment.id),
                            title,
                            start: appointment.startAt,
                            end: appointment.endAt,
                            backgroundColor:
                                appointment.providerColor || undefined,
                            borderColor:
                                appointment.providerColor || undefined,
                            extendedProps: {
                                // CalendarView espera claves tipo "blue", no hex
                                eventColor: statusColor[appointment.status],
                                appointment,
                            },
                        }
                    }),
                )
            } catch (error) {
                toast.push(
                    <Notification type="danger" title="No se pudo cargar la agenda">
                        {getApiErrorMessage(error, 'Error al obtener las citas')}
                    </Notification>,
                )
            }
        },
        [filterProviderId, filterRoomId],
    )

    useEffect(() => {
        if (range) {
            load(range.from, range.to)
        }
    }, [clinicId, load, range])

    const reload = () => {
        if (range) {
            load(range.from, range.to)
        }
    }

    const openCreate = (start?: Date, end?: Date) => {
        const startDate = start || new Date()
        const endDate =
            end || new Date(startDate.getTime() + 30 * 60 * 1000)
        setForm({
            ...emptyForm,
            start: startDate,
            end: endDate,
            providerId:
                filterProviderId ||
                (providers.length === 1 ? providers[0].id : undefined),
            roomId: filterRoomId ?? null,
        })
        setDialogOpen(true)
    }

    const onSelect = (info: DateSelectArg) => {
        if (!canWrite) {
            return
        }
        openCreate(info.start, info.end)
    }

    const onEventClick = (info: EventClickArg) => {
        const appointment = info.event.extendedProps.appointment as Appointment
        setForm({
            id: appointment.id,
            patientId: appointment.patientId,
            providerId: appointment.providerId,
            roomId: appointment.roomId,
            start: new Date(appointment.startAt),
            end: new Date(appointment.endAt),
            status: appointment.status,
            reason: appointment.reason || '',
            notes: appointment.notes || '',
        })
        setDialogOpen(true)
    }

    const persistMove = async (
        info: EventDropArg | EventResizeDoneArg,
    ) => {
        const appointment = info.event.extendedProps.appointment as Appointment
        if (!info.event.start || !info.event.end) {
            info.revert()
            return
        }
        try {
            await apiUpdateAppointment(appointment.id, {
                patientId: appointment.patientId,
                providerId: appointment.providerId,
                roomId: appointment.roomId,
                startAt: toIso(info.event.start),
                endAt: toIso(info.event.end),
                status: appointment.status,
                reason: appointment.reason,
                notes: appointment.notes,
            })
            reload()
        } catch (error) {
            info.revert()
            toast.push(
                <Notification type="danger" title="No se pudo mover la cita">
                    {getApiErrorMessage(error, 'Error al actualizar la cita')}
                </Notification>,
            )
        }
    }

    const save = async () => {
        if (!form.patientId || !form.providerId || !form.start || !form.end) {
            return
        }
        setSaving(true)
        try {
            const payload = {
                patientId: form.patientId,
                providerId: form.providerId,
                roomId: form.roomId ?? null,
                startAt: toIso(form.start),
                endAt: toIso(form.end),
                status: form.status,
                reason: form.reason || null,
                notes: form.notes || null,
            }
            if (form.id) {
                await apiUpdateAppointment(form.id, payload)
            } else {
                await apiCreateAppointment(payload)
            }
            setDialogOpen(false)
            reload()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar la cita')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!toDelete?.id) {
            return
        }
        try {
            await apiDeleteAppointment(toDelete.id)
            setToDelete(null)
            setDialogOpen(false)
            reload()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar la cita')}
                </Notification>,
            )
        }
    }

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const option of statusOptions) {
            counts[option.value] = 0
        }
        for (const event of events) {
            const status = event.extendedProps.appointment.status
            counts[status] = (counts[status] || 0) + 1
        }
        return counts
    }, [events])

    const providerFilterOptions = [
        { value: 0, label: 'Todos los profesionales' },
        ...providers.map((provider) => ({
            value: provider.id,
            label: provider.name,
        })),
    ]

    const roomFilterOptions = [
        { value: 0, label: 'Todas las salas' },
        ...rooms.map((room) => ({
            value: room.id,
            label: room.name,
        })),
    ]

    return (
        <>
            <PageHeader
                title="Agenda"
                subtitle="Clínica"
                info="Selecciona un horario para crear o abre una cita para editarla. Arrastra para reprogramar."
                extra={
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => navigate('/recordatorios')}
                        >
                            Recordatorios
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => navigate('/pacientes')}
                        >
                            Pacientes
                        </Button>
                        <AuthorityCheck
                            authority={[AGENDA_WRITE]}
                            userAuthority={userAuthority}
                        >
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiPlusCircle />}
                                onClick={() => openCreate()}
                            >
                                Nueva cita
                            </Button>
                        </AuthorityCheck>
                    </div>
                }
            />
            <AdaptableCard bodyClass="p-0">
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Select
                        options={providerFilterOptions}
                        value={providerFilterOptions.filter(
                            (option) =>
                                option.value === (filterProviderId || 0),
                        )}
                        onChange={(option) =>
                            setFilterProviderId(
                                option?.value && option.value > 0
                                    ? option.value
                                    : undefined,
                            )
                        }
                    />
                    <Select
                        options={roomFilterOptions}
                        value={roomFilterOptions.filter(
                            (option) => option.value === (filterRoomId || 0),
                        )}
                        onChange={(option) =>
                            setFilterRoomId(
                                option?.value && option.value > 0
                                    ? option.value
                                    : undefined,
                            )
                        }
                    />
                </div>
                <div className="mb-5 flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                        <Tag
                            key={option.value}
                            className={
                                statusTagClass[
                                    option.value as AppointmentStatus
                                ]
                            }
                        >
                            {option.label}
                            {statusCounts[option.value]
                                ? ` · ${statusCounts[option.value]}`
                                : ''}
                        </Tag>
                    ))}
                </div>
                <CalendarView
                    editable={canWrite}
                    selectable={canWrite}
                    locale={esLocale}
                    initialView="timeGridWeek"
                    slotMinTime="07:00:00"
                    slotMaxTime="20:00:00"
                    events={events}
                    datesSet={(info) => {
                        setRange({
                            from: info.start.toISOString(),
                            to: info.end.toISOString(),
                        })
                    }}
                    select={onSelect}
                    eventClick={onEventClick}
                    eventDrop={(info) => persistMove(info)}
                    eventResize={(info) => persistMove(info)}
                />
            </AdaptableCard>
            <AppointmentDrawer
                isOpen={dialogOpen}
                saving={saving}
                canDelete={canDelete}
                form={form}
                onChange={setForm}
                onClose={() => setDialogOpen(false)}
                onSave={save}
                onDelete={() => setToDelete(form)}
            />
            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar cita"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>¿Eliminar esta cita? Esta acción no se puede deshacer.</p>
            </ConfirmDialog>
        </>
    )
}

export default AgendaCalendar
