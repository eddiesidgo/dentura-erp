import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import FormDrawer from '@/components/shared/FormDrawer'
import FormNumericInput from '@/components/shared/FormNumericInput'
import {
    Button,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import { HiOutlineClipboardList, HiPlusCircle } from 'react-icons/hi'
import { PAYMENTS_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateLedgerEntry,
    apiGetLedgerStatement,
} from '@/services/LedgerService'
import { formatMoney } from '../works.constants'
import type { LedgerEntryType, LedgerStatement } from '@/@types/ledger'

const typeOptions = [
    { value: 'CHARGE', label: 'Cargo' },
    { value: 'ADJUSTMENT', label: 'Ajuste' },
]

const typeLabel = (type: LedgerEntryType) => {
    if (type === 'CHARGE') return 'Cargo'
    if (type === 'PAYMENT') return 'Pago'
    if (type === 'ADJUSTMENT') return 'Ajuste'
    return type
}

type PatientLedgerProps = {
    patientId: number
}

const PatientLedger = ({ patientId }: PatientLedgerProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PAYMENTS_WRITE])
    const [statement, setStatement] = useState<LedgerStatement | null>(null)
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formType, setFormType] = useState<'CHARGE' | 'ADJUSTMENT'>('CHARGE')
    const [amount, setAmount] = useState(0)
    const [description, setDescription] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetLedgerStatement(patientId)
            setStatement(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar el libro">
                    {getApiErrorMessage(error, 'Error al obtener movimientos')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        load()
    }, [load])

    const save = async () => {
        if (!amount) {
            return
        }
        setSaving(true)
        try {
            await apiCreateLedgerEntry({
                patientId,
                type: formType,
                amount,
                description: description || null,
            })
            setDialogOpen(false)
            setAmount(0)
            setDescription('')
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al crear movimiento')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-base font-semibold">
                            <HiOutlineClipboardList className="text-lg" />
                            Cuenta corriente
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cargos, pagos y ajustes. Saldo = cargos + ajustes −
                            pagos.
                        </p>
                    </div>
                    {canWrite && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            className="mt-3 lg:mt-0"
                            onClick={() => setDialogOpen(true)}
                        >
                            Cargo / ajuste
                        </Button>
                    )}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat
                        label="Cargos"
                        value={formatMoney(Number(statement?.chargesTotal ?? 0))}
                    />
                    <MiniStat
                        label="Pagos"
                        value={formatMoney(Number(statement?.paymentsTotal ?? 0))}
                    />
                    <MiniStat
                        label="Ajustes"
                        value={formatMoney(
                            Number(statement?.adjustmentsTotal ?? 0),
                        )}
                    />
                    <MiniStat
                        label="Saldo CT"
                        value={formatMoney(Number(statement?.balance ?? 0))}
                        emphasis
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left dark:bg-gray-700/40">
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-3 py-3">Tipo</th>
                                <th className="px-3 py-3">Descripción</th>
                                <th className="px-3 py-3">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(statement?.entries || []).map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-t border-gray-100 dark:border-gray-700"
                                >
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {dayjs(entry.entryDate).format(
                                            'DD/MM/YYYY HH:mm',
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        {typeLabel(entry.type)}
                                    </td>
                                    <td className="px-3 py-3">
                                        {entry.description || '—'}
                                    </td>
                                    <td className="px-3 py-3 font-semibold tabular-nums">
                                        {formatMoney(Number(entry.amount))}
                                    </td>
                                </tr>
                            ))}
                            {!loading &&
                                (statement?.entries?.length ?? 0) === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-10 text-center text-sm text-gray-500"
                                        >
                                            Sin movimientos en el libro.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>

            <FormDrawer
                isOpen={dialogOpen}
                accent="amber"
                icon={<HiOutlineClipboardList />}
                title="Nuevo movimiento"
                saving={saving}
                saveDisabled={!amount}
                onClose={() => setDialogOpen(false)}
                onSave={save}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Tipo</div>
                        <Select
                            options={typeOptions}
                            value={typeOptions.filter(
                                (option) => option.value === formType,
                            )}
                            onChange={(option) =>
                                setFormType(
                                    (option?.value as 'CHARGE' | 'ADJUSTMENT') ||
                                        'CHARGE',
                                )
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Monto</div>
                        <FormNumericInput
                            value={amount}
                            onValueChange={(values) =>
                                setAmount(values.floatValue || 0)
                            }
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            En ajustes podés usar monto negativo.
                        </p>
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">
                            Descripción
                        </div>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
            </FormDrawer>
        </>
    )
}

const MiniStat = ({
    label,
    value,
    emphasis,
}: {
    label: string
    value: string
    emphasis?: boolean
}) => (
    <div
        className={`rounded-lg border px-3 py-3 ${
            emphasis
                ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
                : 'border-gray-200 dark:border-gray-600'
        }`}
    >
        <div className="text-xs uppercase tracking-wide text-gray-500">
            {label}
        </div>
        <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
)

export default PatientLedger
