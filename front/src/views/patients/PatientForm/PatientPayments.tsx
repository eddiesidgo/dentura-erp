import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import FormNumericInput from '@/components/shared/FormNumericInput'
import IconText from '@/components/shared/IconText'
import TableRowActions from '@/components/shared/TableRowActions'
import ReportPreviewModal from '@/components/reports/ReportPreviewModal'
import {
    Button,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import { HiOutlineCash, HiPlusCircle } from 'react-icons/hi'
import {
    PAYMENTS_DELETE,
    PAYMENTS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreatePayment,
    apiDeletePayment,
    apiGetPatientBalance,
    apiGetPayments,
    apiUpdatePayment,
} from '@/services/PaymentService'
import { apiGetWorks } from '@/services/WorkService'
import { formatMoney } from '../works.constants'
import type {
    PatientBalance,
    Payment,
    PaymentMethod,
    PaymentPayload,
} from '@/@types/payment'
import type { Work } from '@/@types/work'

const methodOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'TRANSFER', label: 'Transferencia' },
    { value: 'OTHER', label: 'Otro' },
]

const methodLabel = (value: string) =>
    methodOptions.find((option) => option.value === value)?.label || value

type AllocationForm = {
    workId?: number
    amount: number
}

type PaymentForm = {
    id?: number
    amount: number
    method: PaymentMethod
    notes: string
    allocations: AllocationForm[]
}

const emptyForm: PaymentForm = {
    amount: 0,
    method: 'CASH',
    notes: '',
    allocations: [],
}

type PatientPaymentsProps = {
    patientId: number
}

const PatientPayments = ({ patientId }: PatientPaymentsProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PAYMENTS_WRITE])
    const canDelete = useAuthority(userAuthority, [PAYMENTS_DELETE])

    const [payments, setPayments] = useState<Payment[]>([])
    const [balance, setBalance] = useState<PatientBalance | null>(null)
    const [works, setWorks] = useState<Work[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<PaymentForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Payment | null>(null)
    const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [paymentsRes, balanceRes, worksRes] = await Promise.all([
                apiGetPayments(patientId),
                apiGetPatientBalance(patientId),
                apiGetWorks(patientId),
            ])
            setPayments(paymentsRes.data)
            setBalance(balanceRes.data)
            setWorks(worksRes.data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener los pagos')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const workOptions = useMemo(
        () =>
            works.map((work) => ({
                value: work.id,
                label: `${work.treatmentCode} · ${work.treatmentName} (${formatMoney(work.total)})`,
            })),
        [works],
    )

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (payment: Payment) => {
        setForm({
            id: payment.id,
            amount: Number(payment.amount),
            method: (payment.method as PaymentMethod) || 'CASH',
            notes: payment.notes ?? '',
            allocations: payment.allocations.map((allocation) => ({
                workId: allocation.workId ?? undefined,
                amount: Number(allocation.amount),
            })),
        })
        setDialogOpen(true)
    }

    const savePayment = async () => {
        if (!form.amount || form.amount <= 0) {
            return
        }
        setSaving(true)
        try {
            const payload: PaymentPayload = {
                patientId,
                amount: form.amount,
                method: form.method,
                notes: form.notes || null,
                allocations: form.allocations
                    .filter((item) => item.amount > 0)
                    .map((item) => ({
                        workId: item.workId ?? null,
                        amount: item.amount,
                    })),
            }
            if (form.id) {
                await apiUpdatePayment(form.id, payload)
            } else {
                await apiCreatePayment(payload)
            }
            setDialogOpen(false)
            await loadData()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar el pago')}
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
            await apiDeletePayment(toDelete.id)
            setToDelete(null)
            await loadData()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el pago')}
                </Notification>,
            )
        }
    }

    const addAllocation = () => {
        setForm((prev) => ({
            ...prev,
            allocations: [...prev.allocations, { amount: 0 }],
        }))
    }

    return (
        <>
            <ReportPreviewModal
                isOpen={receiptPaymentId != null}
                onClose={() => setReceiptPaymentId(null)}
                kind="payment-receipt"
                paymentId={receiptPaymentId ?? undefined}
                downloadFilename={`recibo-pago-${receiptPaymentId}.pdf`}
            />
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className="mb-1 text-base font-semibold"
                            icon={<HiOutlineCash className="text-lg" />}
                        >
                            Pagos
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cobros, recibos y saldo pendiente del plan.
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
                            Registrar pago
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <SummaryCard
                        label="Total trabajos"
                        value={formatMoney(Number(balance?.worksTotal ?? 0))}
                    />
                    <SummaryCard
                        label="Pagado"
                        value={formatMoney(Number(balance?.paidTotal ?? 0))}
                        tone="emerald"
                    />
                    <SummaryCard
                        emphasis
                        label="Saldo"
                        value={formatMoney(Number(balance?.balance ?? 0))}
                        tone={
                            Number(balance?.balance ?? 0) > 0
                                ? 'amber'
                                : undefined
                        }
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left bg-gray-50 dark:bg-gray-700/40">
                                <th className="py-3 px-4">Recibo</th>
                                <th className="py-3 px-3">Fecha</th>
                                <th className="py-3 px-3">Método</th>
                                <th className="py-3 px-3">Monto</th>
                                <th className="py-3 px-3">Notas</th>
                                <th className="py-3 px-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="border-t border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 px-4 font-semibold">
                                        #{payment.receiptNumber}
                                    </td>
                                    <td className="py-3 px-3">
                                        {dayjs(payment.paidAt).format(
                                            'DD/MM/YYYY HH:mm',
                                        )}
                                    </td>
                                    <td className="py-3 px-3">
                                        {methodLabel(payment.method)}
                                    </td>
                                    <td className="py-3 px-3 font-semibold tabular-nums">
                                        {formatMoney(Number(payment.amount))}
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                                        {payment.notes || '—'}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <TableRowActions
                                            viewTitle="Ver recibo"
                                            editTitle="Editar"
                                            deleteTitle="Eliminar"
                                            onView={() =>
                                                setReceiptPaymentId(payment.id)
                                            }
                                            onEdit={
                                                canWrite
                                                    ? () => openEdit(payment)
                                                    : undefined
                                            }
                                            onDelete={
                                                canDelete
                                                    ? () => setToDelete(payment)
                                                    : undefined
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                            {!loading && payments.length === 0 && (
                                <tr>
                                    <td
                                        className="py-12 px-4 text-center"
                                        colSpan={6}
                                    >
                                        <p className="font-semibold mb-1">
                                            Sin pagos registrados
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Registra el primer cobro del
                                            paciente.
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
                accent="emerald"
                icon={<HiOutlineCash />}
                title={form.id ? 'Editar pago' : 'Registrar pago'}
                saving={saving}
                saveDisabled={!form.amount || form.amount <= 0}
                onClose={() => setDialogOpen(false)}
                onSave={savePayment}
            >
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 font-semibold">Monto</div>
                            <FormNumericInput
                                value={form.amount}
                                decimalScale={2}
                                inputPrefix="$"
                                onValueChange={(values) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        amount: values.floatValue ?? 0,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <div className="mb-1 font-semibold">Método</div>
                            <Select
                                options={methodOptions}
                                value={methodOptions.filter(
                                    (option) => option.value === form.method,
                                )}
                                onChange={(option) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        method:
                                            (option?.value as PaymentMethod) ||
                                            'CASH',
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Notas</div>
                        <Input
                            textArea
                            placeholder="Observaciones del pago"
                            value={form.notes}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">
                                Asignación a trabajos
                            </div>
                            <Button size="sm" onClick={addAllocation}>
                                Agregar
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {form.allocations.map((allocation, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2"
                                >
                                    <Select
                                        isClearable
                                        placeholder="Trabajo"
                                        options={workOptions}
                                        value={workOptions.filter(
                                            (option) =>
                                                option.value ===
                                                allocation.workId,
                                        )}
                                        onChange={(option) =>
                                            setForm((prev) => {
                                                const next = [
                                                    ...prev.allocations,
                                                ]
                                                next[index] = {
                                                    ...next[index],
                                                    workId: option?.value,
                                                }
                                                return {
                                                    ...prev,
                                                    allocations: next,
                                                }
                                            })
                                        }
                                    />
                                    <FormNumericInput
                                        value={allocation.amount}
                                        decimalScale={2}
                                        inputPrefix="$"
                                        onValueChange={(values) =>
                                            setForm((prev) => {
                                                const next = [
                                                    ...prev.allocations,
                                                ]
                                                next[index] = {
                                                    ...next[index],
                                                    amount:
                                                        values.floatValue ?? 0,
                                                }
                                                return {
                                                    ...prev,
                                                    allocations: next,
                                                }
                                            })
                                        }
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                allocations:
                                                    prev.allocations.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                            }))
                                        }
                                    >
                                        Quitar
                                    </Button>
                                </div>
                            ))}
                            {form.allocations.length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Opcional: reparte el pago entre trabajos del
                                    plan.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar pago"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar el recibo{' '}
                    <span className="font-semibold">
                        #{toDelete?.receiptNumber}
                    </span>
                    ?
                </p>
            </ConfirmDialog>
        </>
    )
}

const SummaryCard = ({
    label,
    value,
    emphasis,
    tone,
}: {
    label: string
    value: string
    emphasis?: boolean
    tone?: 'amber' | 'emerald'
}) => {
    const toneClass =
        tone === 'amber'
            ? 'border-amber-200 bg-amber-50/60 dark:border-amber-700/50 dark:bg-amber-500/10'
            : tone === 'emerald'
              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-500/10'
              : 'border-gray-200 dark:border-gray-600'
    return (
        <div
            className={`rounded-lg border p-3.5 ${toneClass} ${
                emphasis ? 'ring-1 ring-gray-200 dark:ring-gray-600' : ''
            }`}
        >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {label}
            </div>
            <div className="text-base font-semibold tabular-nums">{value}</div>
        </div>
    )
}

export default PatientPayments
