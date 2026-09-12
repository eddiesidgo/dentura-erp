import { useCallback, useEffect, useMemo, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import IconText from '@/components/shared/IconText'
import TableRowActions from '@/components/shared/TableRowActions'
import {
    Button,
    Checkbox,
    Input,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineHeart, HiPlusCircle } from 'react-icons/hi'
import {
    ODONTOGRAM_DELETE,
    ODONTOGRAM_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateOdontogramEntry,
    apiDeleteOdontogramEntry,
    apiGetOdontogramEntries,
    apiUpdateOdontogramEntry,
} from '@/services/OdontogramService'
import type {
    OdontogramCondition,
    OdontogramEntry,
    OdontogramEntryPayload,
    OdontogramStatus,
} from '@/@types/odontogram'

const UPPER_TEETH = [
    '18',
    '17',
    '16',
    '15',
    '14',
    '13',
    '12',
    '11',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
]
const LOWER_TEETH = [
    '48',
    '47',
    '46',
    '45',
    '44',
    '43',
    '42',
    '41',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
]

const SURFACE_OPTIONS = ['M', 'O', 'D', 'B', 'L'] as const

const conditionOptions: { value: OdontogramCondition; label: string }[] = [
    { value: 'CARIES', label: 'Caries' },
    { value: 'FILLING', label: 'Obturación' },
    { value: 'MISSING', label: 'Ausente' },
    { value: 'CROWN', label: 'Corona' },
    { value: 'ENDO', label: 'Endodoncia' },
    { value: 'IMPLANT', label: 'Implante' },
    { value: 'EXTRACTION_PLANNED', label: 'Extracción planificada' },
    { value: 'OTHER', label: 'Otro' },
]

const statusOptions: { value: OdontogramStatus; label: string }[] = [
    { value: 'EXISTING', label: 'Existente' },
    { value: 'PLANNED', label: 'Planificado' },
    { value: 'COMPLETED', label: 'Completado' },
]

const conditionLabel = (value: string) =>
    conditionOptions.find((option) => option.value === value)?.label || value

const statusLabel = (value: string) =>
    statusOptions.find((option) => option.value === value)?.label || value

const statusClass: Record<string, string> = {
    EXISTING:
        'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100 border-0',
    PLANNED:
        'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100 border-0',
    COMPLETED:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0',
}

type EntryForm = {
    id?: number
    tooth: string
    surfaces: string[]
    condition: OdontogramCondition
    status: OdontogramStatus
    notes: string
}

const emptyForm = (tooth = ''): EntryForm => ({
    tooth,
    surfaces: [],
    condition: 'CARIES',
    status: 'EXISTING',
    notes: '',
})

type PatientOdontogramProps = {
    patientId: number
}

const PatientOdontogram = ({ patientId }: PatientOdontogramProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [ODONTOGRAM_WRITE])
    const canDelete = useAuthority(userAuthority, [ODONTOGRAM_DELETE])

    const [entries, setEntries] = useState<OdontogramEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<EntryForm>(emptyForm())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<OdontogramEntry | null>(null)

    const loadEntries = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetOdontogramEntries(patientId)
            setEntries(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener el odontograma',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        loadEntries()
    }, [loadEntries])

    const entriesByTooth = useMemo(() => {
        const map = new Map<string, OdontogramEntry[]>()
        entries.forEach((entry) => {
            const list = map.get(entry.tooth) || []
            list.push(entry)
            map.set(entry.tooth, list)
        })
        return map
    }, [entries])

    const openCreate = (tooth?: string) => {
        setForm(emptyForm(tooth || ''))
        setDialogOpen(true)
    }

    const openEdit = (entry: OdontogramEntry) => {
        setForm({
            id: entry.id,
            tooth: entry.tooth,
            surfaces: (entry.surfaces || '')
                .toUpperCase()
                .split('')
                .filter((surface) =>
                    SURFACE_OPTIONS.includes(
                        surface as (typeof SURFACE_OPTIONS)[number],
                    ),
                ),
            condition: entry.condition,
            status: entry.status,
            notes: entry.notes ?? '',
        })
        setDialogOpen(true)
    }

    const saveEntry = async () => {
        if (!form.tooth || !form.condition) {
            return
        }
        setSaving(true)
        try {
            const payload: OdontogramEntryPayload = {
                patientId,
                tooth: form.tooth,
                surfaces: form.surfaces.join('') || null,
                condition: form.condition,
                status: form.status,
                notes: form.notes || null,
            }
            if (form.id) {
                await apiUpdateOdontogramEntry(form.id, payload)
            } else {
                await apiCreateOdontogramEntry(payload)
            }
            setDialogOpen(false)
            await loadEntries()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(
                        error,
                        'Error al guardar la entrada',
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
            await apiDeleteOdontogramEntry(toDelete.id)
            setToDelete(null)
            await loadEntries()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(
                        error,
                        'Error al eliminar la entrada',
                    )}
                </Notification>,
            )
        }
    }

    const renderToothRow = (teeth: string[], label: string) => (
        <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {teeth.map((tooth, index) => {
                    const count = entriesByTooth.get(tooth)?.length || 0
                    return (
                        <button
                            key={tooth}
                            type="button"
                            disabled={!canWrite && count === 0}
                            className={`relative min-w-[2.5rem] h-10 rounded-md border text-sm font-semibold transition ${
                                count > 0
                                    ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-100'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                            } ${index === 7 ? 'mr-3' : ''}`}
                            onClick={() => {
                                if (canWrite) {
                                    openCreate(tooth)
                                    return
                                }
                                const existing = entriesByTooth.get(tooth)?.[0]
                                if (existing) {
                                    openEdit(existing)
                                }
                            }}
                        >
                            {tooth}
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] text-white">
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    return (
        <>
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className="mb-1 text-base font-semibold"
                            icon={<HiOutlineHeart className="text-lg" />}
                        >
                            Odontograma
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Piezas FDI adultas. Haz clic en un diente para
                            registrar superficies y condición.
                        </p>
                    </div>
                    {canWrite && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            className="mt-3 lg:mt-0"
                            onClick={() => openCreate()}
                        >
                            Nueva entrada
                        </Button>
                    )}
                </div>

                {renderToothRow(UPPER_TEETH, 'Arcada superior')}
                {renderToothRow(LOWER_TEETH, 'Arcada inferior')}

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 mt-2">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left bg-gray-50 dark:bg-gray-700/40">
                                <th className="py-3 px-4">Pieza</th>
                                <th className="py-3 px-3">Superficies</th>
                                <th className="py-3 px-3">Condición</th>
                                <th className="py-3 px-3">Estado</th>
                                <th className="py-3 px-3">Notas</th>
                                <th className="py-3 px-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-t border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 px-4 font-semibold">
                                        {entry.tooth}
                                    </td>
                                    <td className="py-3 px-3">
                                        {entry.surfaces || '—'}
                                    </td>
                                    <td className="py-3 px-3">
                                        {conditionLabel(entry.condition)}
                                    </td>
                                    <td className="py-3 px-3">
                                        <Tag
                                            className={
                                                statusClass[entry.status] || ''
                                            }
                                        >
                                            {statusLabel(entry.status)}
                                        </Tag>
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                                        {entry.notes || '—'}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <TableRowActions
                                            editTitle="Editar"
                                            deleteTitle="Eliminar"
                                            onEdit={
                                                canWrite
                                                    ? () => openEdit(entry)
                                                    : undefined
                                            }
                                            onDelete={
                                                canDelete
                                                    ? () => setToDelete(entry)
                                                    : undefined
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                            {!loading && entries.length === 0 && (
                                <tr>
                                    <td
                                        className="py-12 px-4 text-center"
                                        colSpan={6}
                                    >
                                        <p className="font-semibold mb-1">
                                            Sin registros en el odontograma
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Selecciona una pieza para comenzar.
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
                accent="sky"
                icon={<HiOutlineHeart />}
                title={form.id ? 'Editar entrada' : 'Nueva entrada'}
                subtitle={form.tooth ? `Pieza ${form.tooth}` : undefined}
                saving={saving}
                saveDisabled={!form.tooth || !form.condition}
                onClose={() => setDialogOpen(false)}
                onSave={saveEntry}
            >
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Pieza (FDI)</div>
                        <Input
                            placeholder="11"
                            value={form.tooth}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    tooth: e.target.value.replace(/\D/g, '').slice(0, 2),
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Superficies</div>
                        <div className="flex flex-wrap gap-3">
                            {SURFACE_OPTIONS.map((surface) => (
                                <Checkbox
                                    key={surface}
                                    checked={form.surfaces.includes(surface)}
                                    onChange={(checked) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            surfaces: checked
                                                ? [...prev.surfaces, surface]
                                                : prev.surfaces.filter(
                                                      (item) => item !== surface,
                                                  ),
                                        }))
                                    }
                                >
                                    {surface}
                                </Checkbox>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Condición</div>
                        <Select
                            options={conditionOptions}
                            value={conditionOptions.filter(
                                (option) => option.value === form.condition,
                            )}
                            onChange={(option) =>
                                setForm((prev) => ({
                                    ...prev,
                                    condition:
                                        (option?.value as OdontogramCondition) ||
                                        'CARIES',
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
                                        (option?.value as OdontogramStatus) ||
                                        'EXISTING',
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
                title="Eliminar entrada"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar la entrada de la pieza{' '}
                    <span className="font-semibold">{toDelete?.tooth}</span>?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientOdontogram
