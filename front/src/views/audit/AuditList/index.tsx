import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import PageHeader from '@/components/shared/PageHeader'
import { Notification, toast } from '@/components/ui'
import { getApiErrorMessage } from '@/services/PatientService'
import { apiGetAuditEvents } from '@/services/AuditService'
import type { AuditEvent } from '@/@types/audit'

const AuditList = () => {
    const [events, setEvents] = useState<AuditEvent[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetAuditEvents({ page: 1, size: 50 })
            setEvents(data.data)
            setTotal(data.total)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al cargar auditoría')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <>
            <PageHeader
                title="Auditoría"
                subtitle="Seguridad"
                info="Registro de altas, cambios y eliminaciones en pacientes, citas, pagos y trabajos."
                chips={[`${total} evento${total === 1 ? '' : 's'}`]}
            />
            <AdaptableCard>
                {loading ? (
                    <p className="text-sm text-slate-500">Cargando…</p>
                ) : events.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No hay eventos registrados todavía.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="px-2 py-2">Fecha</th>
                                    <th className="px-2 py-2">Usuario</th>
                                    <th className="px-2 py-2">Acción</th>
                                    <th className="px-2 py-2">Entidad</th>
                                    <th className="px-2 py-2">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="border-b border-slate-100 dark:border-slate-800"
                                    >
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {new Date(
                                                event.createdAt,
                                            ).toLocaleString('es-SV')}
                                        </td>
                                        <td className="px-2 py-2">
                                            {event.username || '—'}
                                        </td>
                                        <td className="px-2 py-2">
                                            {event.action}
                                        </td>
                                        <td className="px-2 py-2">
                                            {event.entityType}
                                            {event.entityId
                                                ? ` #${event.entityId}`
                                                : ''}
                                        </td>
                                        <td className="px-2 py-2 max-w-xs truncate">
                                            {event.detail || '—'}
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

export default AuditList
