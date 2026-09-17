import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import PageHeader from '@/components/shared/PageHeader'
import { Button, Notification, Tag, toast } from '@/components/ui'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import { AGENDA_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiGenerateReminders,
    apiGetReminders,
    apiMarkReminderSent,
    apiMarkReminderSkipped,
} from '@/services/ReminderService'
import type { Reminder } from '@/@types/reminder'

const ReminderList = () => {
    const userAuthority = useAppSelector((state) => state.auth.user.authority) || []
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [generating, setGenerating] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetReminders('PENDING')
            setReminders(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al cargar recordatorios')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const generate = async () => {
        setGenerating(true)
        try {
            const { data } = await apiGenerateReminders()
            toast.push(
                <Notification type="success" title="Cola actualizada">
                    Creados: {data.created} · Omitidos: {data.skipped}
                </Notification>,
            )
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo generar">
                    {getApiErrorMessage(error, 'Error al generar')}
                </Notification>,
            )
        } finally {
            setGenerating(false)
        }
    }

    const markSent = async (id: number) => {
        setBusyId(id)
        try {
            await apiMarkReminderSent(id)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo marcar">
                    {getApiErrorMessage(error, 'Error al actualizar')}
                </Notification>,
            )
        } finally {
            setBusyId(null)
        }
    }

    const markSkipped = async (id: number) => {
        setBusyId(id)
        try {
            await apiMarkReminderSkipped(id)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo omitir">
                    {getApiErrorMessage(error, 'Error al actualizar')}
                </Notification>,
            )
        } finally {
            setBusyId(null)
        }
    }

    return (
        <>
            <PageHeader
                title="Recordatorios"
                subtitle="WhatsApp"
                info="Cola pendiente de envío manual por wa.me. Abrí WhatsApp, enviá el mensaje y marcá como enviado."
                chips={[`${reminders.length} pendiente${reminders.length === 1 ? '' : 's'}`]}
                extra={
                    <AuthorityCheck
                        authority={[AGENDA_WRITE]}
                        userAuthority={userAuthority}
                    >
                        <Button
                            size="sm"
                            variant="solid"
                            loading={generating}
                            onClick={generate}
                        >
                            Generar ahora
                        </Button>
                    </AuthorityCheck>
                }
            />
            <AdaptableCard>
                {loading ? (
                    <p className="text-sm text-slate-500">Cargando…</p>
                ) : reminders.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No hay recordatorios pendientes. Generá la cola o esperá
                        al job horario.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="px-2 py-2">Paciente</th>
                                    <th className="px-2 py-2">Cita</th>
                                    <th className="px-2 py-2">Teléfono</th>
                                    <th className="px-2 py-2">Mensaje</th>
                                    <th className="px-2 py-2">Estado</th>
                                    <th className="px-2 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reminders.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-100 dark:border-slate-800"
                                    >
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.patientName}
                                        </td>
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.appointmentStartAt
                                                ? new Date(
                                                      item.appointmentStartAt,
                                                  ).toLocaleString('es-SV')
                                                : '—'}
                                        </td>
                                        <td className="px-2 py-2">
                                            {item.phoneNormalized}
                                        </td>
                                        <td className="px-2 py-2 max-w-xs truncate">
                                            {item.messageBody}
                                        </td>
                                        <td className="px-2 py-2">
                                            <Tag className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
                                                {item.status}
                                            </Tag>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    onClick={() =>
                                                        window.open(
                                                            item.waMeUrl,
                                                            '_blank',
                                                            'noopener,noreferrer',
                                                        )
                                                    }
                                                >
                                                    Abrir WhatsApp
                                                </Button>
                                                <AuthorityCheck
                                                    authority={[AGENDA_WRITE]}
                                                    userAuthority={userAuthority}
                                                >
                                                    <Button
                                                        size="xs"
                                                        loading={busyId === item.id}
                                                        onClick={() =>
                                                            markSent(item.id)
                                                        }
                                                    >
                                                        Marcar enviado
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        loading={busyId === item.id}
                                                        onClick={() =>
                                                            markSkipped(item.id)
                                                        }
                                                    >
                                                        Omitir
                                                    </Button>
                                                </AuthorityCheck>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdaptableCard>
        </>
    )
}

export default ReminderList
