import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import IconText from '@/components/shared/IconText'
import TableRowActions from '@/components/shared/TableRowActions'
import {
    Button,
    Input,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineShare, HiPlusCircle } from 'react-icons/hi'
import {
    REFERRALS_DELETE,
    REFERRALS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateOutboundReferral,
    apiDeleteOutboundReferral,
    apiGetOutboundReferrals,
    apiUpdateOutboundReferral,
} from '@/services/ReferralService'
import type {
    OutboundReferral,
    OutboundReferralPayload,
    OutboundReferralStatus,
} from '@/@types/referral'

const statusOptions: { value: OutboundReferralStatus; label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'SENT', label: 'Enviado' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
]

const statusLabel = (value: string) =>
    statusOptions.find((option) => option.value === value)?.label || value

const statusClass: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-0',
    SENT: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100 border-0',
    COMPLETED:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0',
    CANCELLED:
        'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-0',
}

type ReferralForm = {
    id?: number
    specialty: string
    toName: string
    reason: string
    status: OutboundReferralStatus
    notes: string
}

const emptyForm: ReferralForm = {
    specialty: '',
    toName: '',
    reason: '',
    status: 'DRAFT',
    notes: '',
}

type PatientReferralsProps = {
    patientId: number
}

const PatientReferrals = ({ patientId }: PatientReferralsProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [REFERRALS_WRITE])
    const canDelete = useAuthority(userAuthority, [REFERRALS_DELETE])

    const [items, setItems] = useState<OutboundReferral[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<ReferralForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<OutboundReferral | null>(null)

    const loadReferrals = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetOutboundReferrals(patientId)
            setItems(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener las referencias',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        loadReferrals()
    }, [loadReferrals])

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (item: OutboundReferral) => {
        setForm({
            id: item.id,
            specialty: item.specialty,
            toName: item.toName ?? '',
            reason: item.reason ?? '',
            status: (item.status as OutboundReferralStatus) || 'DRAFT',
            notes: item.notes ?? '',
        })
        setDialogOpen(true)
    }

    const saveReferral = async () => {
        if (!form.specialty.trim()) {
            return
        }
        setSaving(true)
        try {
            const payload: OutboundReferralPayload = {
                patientId,
                specialty: form.specialty.trim(),
                toName: form.toName || null,
                reason: form.reason || null,
                status: form.status,
                notes: form.notes || null,
            }
            if (form.id) {
                await apiUpdateOutboundReferral(form.id, payload)
            } else {
                await apiCreateOutboundReferral(payload)
            }
            setDialogOpen(false)
            await loadReferrals()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(
                        error,
                        'Error al guardar la referencia',
                    )}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!toDelete) {
            return
        }
        try {
            await apiDeleteOutboundReferral(toDelete.id)
            setToDelete(null)
            await loadReferrals()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(
                        error,
                        'Error al eliminar la referencia',
                    )}
                </Notification>,
            )
        }
    }

    return (
        <>
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className="mb-1 text-base font-semibold"
                            icon={<HiOutlineShare className="text-lg" />}
                        >
                            Referencias salientes
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Derivaciones a otras especialidades o clínicas. La
                            fuente de referido de entrada se edita en Datos.
                        </p>
                    </div>
                    {canWrite && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            className="mt-3 lg:mt-0"
                            onClick={openCreate}
                        >
                            Nueva referencia
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left bg-gray-50 dark:bg-gray-700/40">
                                <th className="py-3 px-4">Especialidad</th>
                                <th className="py-3 px-3">Destino</th>
                                <th className="py-3 px-3">Estado</th>
                                <th className="py-3 px-3">Fecha</th>
                                <th className="py-3 px-3">Motivo</th>
                                <th className="py-3 px-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 px-4 font-semibold">
                                        {item.specialty}
                                    </td>
                                    <td className="py-3 px-3">
                                        {item.toName || '—'}
                                    </td>
                                    <td className="py-3 px-3">
                                        <Tag
                                            className={
                                                statusClass[item.status] || ''
                                            }
                                        >
                                            {statusLabel(item.status)}
                                        </Tag>
                                    </td>
                                    <td className="py-3 px-3">
                                        {dayjs(item.referredAt).format(
                                            'DD/MM/YYYY',
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                                        {item.reason || '—'}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <TableRowActions
                                            editTitle="Editar"
                                            deleteTitle="Eliminar"
                                            onEdit={
                                                canWrite
                                                    ? () => openEdit(item)
                                                    : undefined
                                            }
                                            onDelete={
                                                canDelete
                                                    ? () => setToDelete(item)
                                                    : undefined
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td
                                        className="py-12 px-4 text-center"
                                        colSpan={6}
                                    >
                                        <p className="font-semibold mb-1">
                                            Sin referencias salientes
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Registra derivaciones del paciente.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>

            <FormDrawer
                isOpen={dialogOpen}
                accent="rose"
                icon={<HiOutlineShare />}
                title={
                    form.id ? 'Editar referencia' : 'Nueva referencia'
                }
                saving={saving}
                saveDisabled={!form.specialty.trim()}
                onClose={() => setDialogOpen(false)}
                onSave={saveReferral}
            >
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Especialidad</div>
                        <Input
                            placeholder="Ortodoncia"
                            value={form.specialty}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    specialty: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Destino</div>
                        <Input
                            placeholder="Dr. / clínica"
                            value={form.toName}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    toName: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Estado</div>
                        <Select
                            options={statusOptions}
                            value={statusOptions.filter(
                                (option) => option.value === form.status,
                            )}
                            onChange={(option) =>
                                setForm((prev) => ({
                                    ...prev,
                                    status:
                                        (option?.value as OutboundReferralStatus) ||
                                        'DRAFT',
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Motivo</div>
                        <Input
                            textArea
                            placeholder="Motivo de la derivación"
                            value={form.reason}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    reason: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Notas</div>
                        <Input
                            textArea
                            placeholder="Observaciones"
                            value={form.notes}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar referencia"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar la referencia a{' '}
                    <span className="font-semibold">{toDelete?.specialty}</span>
                    ?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientReferrals
