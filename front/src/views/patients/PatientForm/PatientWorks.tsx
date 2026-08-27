import { useCallback, useEffect, useMemo, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormNumericInput from '@/components/shared/FormNumericInput'
import {
    Button,
    Dialog,
    Input,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import { HiPlusCircle } from 'react-icons/hi'
import {
    WORKS_DELETE,
    WORKS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import { apiGetTreatments } from '@/services/TreatmentService'
import {
    apiCreateWork,
    apiDeleteWork,
    apiGetWorks,
    apiUpdateWork,
} from '@/services/WorkService'
import {
    formatMoney,
    workStatusClass,
    workStatusLabel,
    workStatusOptions,
} from '../works.constants'
import type { Treatment } from '@/@types/treatment'
import type { Work, WorkPayload, WorkStatus } from '@/@types/work'

type TreatmentOption = { value: number; label: string; price: number }
type StatusOption = { value: WorkStatus; label: string }

type WorkForm = {
    id?: number
    treatmentId?: number
    status: WorkStatus
    quantity: number
    unitPrice: number
    tooth: string
    notes: string
}

const emptyForm: WorkForm = {
    status: 'PENDING',
    quantity: 1,
    unitPrice: 0,
    tooth: '',
    notes: '',
}

const toOption = (treatment: Treatment): TreatmentOption => ({
    value: treatment.id,
    label: `${treatment.code} · ${treatment.name}`,
    price: treatment.price,
})

type PatientWorksProps = {
    patientId: number
}

const PatientWorks = ({ patientId }: PatientWorksProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [WORKS_WRITE])
    const canDelete = useAuthority(userAuthority, [WORKS_DELETE])

    const [works, setWorks] = useState<Work[]>([])
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState<TreatmentOption[]>([])
    const [form, setForm] = useState<WorkForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Work | null>(null)

    const loadWorks = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetWorks(patientId)
            setWorks(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener los trabajos')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        loadWorks()
    }, [loadWorks])

    useEffect(() => {
        let cancelled = false
        const loadCatalog = async () => {
            try {
                const { data } = await apiGetTreatments({
                    page: 1,
                    size: 200,
                    active: true,
                })
                if (!cancelled) {
                    setOptions(data.data.map(toOption))
                }
            } catch {
                if (!cancelled) {
                    setOptions([])
                }
            }
        }
        loadCatalog()
        return () => {
            cancelled = true
        }
    }, [])

    const searchTreatments = async (input: string) => {
        try {
            const { data } = await apiGetTreatments({
                q: input,
                page: 1,
                size: 50,
                active: true,
            })
            setOptions(data.data.map(toOption))
        } catch {
            /* keep previous options */
        }
    }

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (work: Work) => {
        setOptions((prev) => {
            if (prev.some((option) => option.value === work.treatmentId)) {
                return prev
            }
            return [
                {
                    value: work.treatmentId,
                    label: `${work.treatmentCode} · ${work.treatmentName}`,
                    price: work.unitPrice,
                },
                ...prev,
            ]
        })
        setForm({
            id: work.id,
            treatmentId: work.treatmentId,
            status: work.status,
            quantity: work.quantity,
            unitPrice: work.unitPrice,
            tooth: work.tooth ?? '',
            notes: work.notes ?? '',
        })
        setDialogOpen(true)
    }

    const saveWork = async () => {
        if (!form.treatmentId) {
            return
        }
        setSaving(true)
        try {
            const payload: WorkPayload = {
                patientId,
                treatmentId: form.treatmentId,
                status: form.status,
                quantity: form.quantity,
                unitPrice: form.unitPrice,
                tooth: form.tooth || null,
                notes: form.notes || null,
            }
            if (form.id) {
                await apiUpdateWork(form.id, payload)
            } else {
                await apiCreateWork(payload)
            }
            setDialogOpen(false)
            await loadWorks()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar el trabajo')}
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
            await apiDeleteWork(toDelete.id)
            setToDelete(null)
            await loadWorks()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el trabajo')}
                </Notification>,
            )
        }
    }

    const selectedTreatment = useMemo(
        () => options.filter((option) => option.value === form.treatmentId),
        [options, form.treatmentId],
    )

    const totals = useMemo(() => {
        const byStatus = (status: WorkStatus) =>
            works
                .filter((work) => work.status === status)
                .reduce((sum, work) => sum + Number(work.total), 0)
        const pending = byStatus('PENDING')
        const completed = byStatus('COMPLETED')
        const rejected = byStatus('REJECTED')
        return {
            pending,
            completed,
            rejected,
            quote: pending + completed,
        }
    }, [works])

    return (
        <>
            <AdaptableCard className="mb-4">
                <div className="lg:flex items-center justify-between mb-4">
                    <div>
                        <h5 className="mb-1">Plan de tratamientos</h5>
                        <p className="text-sm">
                            Pendiente, terminado o no aceptado. Los totales
                            sirven de cotización; aún no hay facturación.
                        </p>
                    </div>
                    {canWrite && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            onClick={openCreate}
                        >
                            Agregar trabajo
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <SummaryCard
                        label="Pendiente"
                        value={formatMoney(totals.pending)}
                    />
                    <SummaryCard
                        label="Terminado"
                        value={formatMoney(totals.completed)}
                    />
                    <SummaryCard
                        label="No aceptado"
                        value={formatMoney(totals.rejected)}
                    />
                    <SummaryCard
                        emphasis
                        label="Cotización"
                        value={formatMoney(totals.quote)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-gray-200 dark:border-gray-600">
                                <th className="py-2 pr-4">Tratamiento</th>
                                <th className="py-2 pr-4">Ubica.</th>
                                <th className="py-2 pr-4">Cant.</th>
                                <th className="py-2 pr-4">Precio</th>
                                <th className="py-2 pr-4">Total</th>
                                <th className="py-2 pr-4">Estado</th>
                                <th className="py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {works.map((work) => (
                                <tr
                                    key={work.id}
                                    className="border-b border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 pr-4">
                                        <div className="font-semibold">
                                            {work.treatmentCode}
                                        </div>
                                        <div className="text-xs opacity-70">
                                            {work.treatmentName}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {work.tooth || '—'}
                                    </td>
                                    <td className="py-3 pr-4">{work.quantity}</td>
                                    <td className="py-3 pr-4">
                                        {formatMoney(work.unitPrice)}
                                    </td>
                                    <td className="py-3 pr-4 font-semibold">
                                        {formatMoney(work.total)}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Tag className={workStatusClass[work.status]}>
                                            {workStatusLabel(work.status)}
                                        </Tag>
                                    </td>
                                    <td className="py-3 text-right whitespace-nowrap">
                                        {canWrite && (
                                            <Button
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => openEdit(work)}
                                            >
                                                Editar
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                size="sm"
                                                onClick={() => setToDelete(work)}
                                            >
                                                <span className="text-red-500">
                                                    Eliminar
                                                </span>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && works.length === 0 && (
                                <tr>
                                    <td className="py-6 opacity-70" colSpan={7}>
                                        Este paciente aún no tiene trabajos en el
                                        plan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>

            <Dialog
                isOpen={dialogOpen}
                width={560}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-4">
                    {form.id ? 'Editar trabajo' : 'Agregar trabajo'}
                </h5>
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Tratamiento</div>
                        <Select
                            isSearchable
                            placeholder="Buscar en el catálogo"
                            options={options}
                            value={selectedTreatment}
                            onInputChange={(value, meta) => {
                                if (meta.action === 'input-change') {
                                    searchTreatments(value)
                                }
                            }}
                            onChange={(option) =>
                                setForm((prev) => ({
                                    ...prev,
                                    treatmentId: option?.value,
                                    unitPrice:
                                        prev.id && prev.treatmentId === option?.value
                                            ? prev.unitPrice
                                            : option?.price ?? 0,
                                }))
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 font-semibold">Estado</div>
                            <Select
                                options={workStatusOptions}
                                value={workStatusOptions.filter(
                                    (option) => option.value === form.status,
                                )}
                                onChange={(option) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        status:
                                            (option as StatusOption | null)
                                                ?.value || 'PENDING',
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <div className="mb-1 font-semibold">Ubicación</div>
                            <Input
                                placeholder="1.6"
                                value={form.tooth}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        tooth: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 font-semibold">Cantidad</div>
                            <FormNumericInput
                                value={form.quantity}
                                decimalScale={0}
                                allowNegative={false}
                                onValueChange={(values) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        quantity: values.floatValue || 1,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <div className="mb-1 font-semibold">
                                Precio unitario
                            </div>
                            <FormNumericInput
                                value={form.unitPrice}
                                decimalScale={2}
                                inputPrefix="$"
                                onValueChange={(values) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        unitPrice: values.floatValue ?? 0,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Notas</div>
                        <Input
                            textArea
                            placeholder="Observaciones del trabajo"
                            value={form.notes}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="text-right mt-2">
                        <Button
                            className="mr-2"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={saving}
                            onClick={saveWork}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar trabajo"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar{' '}
                    <span className="font-semibold">
                        {toDelete?.treatmentCode} · {toDelete?.treatmentName}
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
}: {
    label: string
    value: string
    emphasis?: boolean
}) => (
    <div
        className={`rounded-lg border border-gray-200 dark:border-gray-600 p-3 ${
            emphasis ? 'bg-gray-50 dark:bg-gray-700' : ''
        }`}
    >
        <div className="text-xs opacity-70">{label}</div>
        <div className="text-base font-semibold">{value}</div>
    </div>
)

export default PatientWorks
