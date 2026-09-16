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
    Segment,
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
import OdontogramChart from './odontogram/OdontogramChart'
import OdontogramToolbar from './odontogram/OdontogramToolbar'
import ToothLabDialog from './odontogram/ToothLabDialog'
import {
    SURFACE_OPTIONS,
    WHOLE_TOOTH_CONDITIONS,
    type Dentition,
    type ToothSurface,
} from './odontogram/constants'
import {
    findEntryForSurface,
    findWholeToothEntry,
    removeSurface,
} from './odontogram/findEntry'
import { parseSurfaces } from './odontogram/resolveToothPaint'

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

const emptyForm = (
    tooth = '',
    surfaces: string[] = [],
    condition: OdontogramCondition = 'CARIES',
    status: OdontogramStatus = 'EXISTING',
): EntryForm => ({
    tooth,
    surfaces,
    condition,
    status,
    notes: '',
})

type PatientOdontogramProps = {
    patientId: number
    /** Hide the inner card title when the parent page already has a header. */
    embedded?: boolean
}

const PatientOdontogram = ({
    patientId,
    embedded = false,
}: PatientOdontogramProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [ODONTOGRAM_WRITE])
    const canDelete = useAuthority(userAuthority, [ODONTOGRAM_DELETE])

    const [entries, setEntries] = useState<OdontogramEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<EntryForm>(emptyForm())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [painting, setPainting] = useState(false)
    const [toDelete, setToDelete] = useState<OdontogramEntry | null>(null)
    const [labTooth, setLabTooth] = useState<string | null>(null)
    const [dentition, setDentition] = useState<Dentition>('permanent')
    const [activeCondition, setActiveCondition] =
        useState<OdontogramCondition | null>(null)
    const [activeStatus, setActiveStatus] =
        useState<OdontogramStatus>('EXISTING')

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

    const openCreate = (
        tooth?: string,
        surface?: ToothSurface,
        condition?: OdontogramCondition,
        status?: OdontogramStatus,
    ) => {
        setForm(
            emptyForm(
                tooth || '',
                surface ? [surface] : [],
                condition || 'CARIES',
                status || 'EXISTING',
            ),
        )
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
                    SURFACE_OPTIONS.includes(surface as ToothSurface),
                ),
            condition: entry.condition,
            status: entry.status,
            notes: entry.notes ?? '',
        })
        setDialogOpen(true)
    }

    const paintEntry = async (tooth: string, surface?: ToothSurface) => {
        if (!activeCondition || painting) {
            return
        }
        const whole = WHOLE_TOOTH_CONDITIONS.has(activeCondition)
        const toothEntries = entriesByTooth.get(tooth) || []

        // Surface conditions need an explicit face — never save blank surfaces
        // (blank used to paint the whole crown as the first condition).
        if (!whole && !surface) {
            openCreate(tooth, undefined, activeCondition, activeStatus)
            return
        }

        setPainting(true)
        try {
            if (whole) {
                const existingWhole = findWholeToothEntry(toothEntries)
                const payload: OdontogramEntryPayload = {
                    patientId,
                    tooth,
                    surfaces: null,
                    condition: activeCondition,
                    status: activeStatus,
                    notes: existingWhole?.notes ?? null,
                }
                if (existingWhole) {
                    await apiUpdateOdontogramEntry(existingWhole.id, payload)
                } else {
                    await apiCreateOdontogramEntry(payload)
                }
            } else if (surface) {
                const existing = findEntryForSurface(toothEntries, surface)
                if (existing) {
                    const listed = parseSurfaces(existing.surfaces)
                    if (listed.length > 1 && listed.includes(surface)) {
                        // Split multi-surface entry so other faces keep their condition
                        await apiUpdateOdontogramEntry(existing.id, {
                            patientId,
                            tooth,
                            surfaces: removeSurface(existing.surfaces, surface),
                            condition: existing.condition,
                            status: existing.status,
                            notes: existing.notes,
                        })
                        await apiCreateOdontogramEntry({
                            patientId,
                            tooth,
                            surfaces: surface,
                            condition: activeCondition,
                            status: activeStatus,
                            notes: null,
                        })
                    } else {
                        await apiUpdateOdontogramEntry(existing.id, {
                            patientId,
                            tooth,
                            surfaces: surface,
                            condition: activeCondition,
                            status: activeStatus,
                            notes: existing.notes,
                        })
                    }
                } else {
                    await apiCreateOdontogramEntry({
                        patientId,
                        tooth,
                        surfaces: surface,
                        condition: activeCondition,
                        status: activeStatus,
                        notes: null,
                    })
                }
            }
            await loadEntries()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo registrar">
                    {getApiErrorMessage(
                        error,
                        'Error al aplicar la convención',
                    )}
                </Notification>,
            )
        } finally {
            setPainting(false)
        }
    }

    const handleSurfaceClick = (tooth: string, surface: ToothSurface) => {
        if (canWrite && activeCondition) {
            void paintEntry(tooth, surface)
            return
        }
        // Sin convención: el clic entra a la vista ampliada de la pieza
        setLabTooth(tooth)
    }

    const handleToothClick = (tooth: string) => {
        if (canWrite && activeCondition) {
            void paintEntry(tooth)
            return
        }
        setLabTooth(tooth)
    }

    const handleLabSurfaceClick = (tooth: string, surface: ToothSurface) => {
        if (canWrite && activeCondition) {
            void paintEntry(tooth, surface)
            return
        }
        const existing = findEntryForSurface(
            entriesByTooth.get(tooth) || [],
            surface,
        )
        if (existing) {
            openEdit(existing)
            return
        }
        if (canWrite) {
            openCreate(tooth, surface)
        }
    }

    const handleLabToothClick = (tooth: string) => {
        if (canWrite && activeCondition) {
            void paintEntry(tooth)
            return
        }
        if (canWrite) {
            openCreate(tooth)
        }
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

    return (
        <>
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        {!embedded && (
                            <IconText
                                className="mb-1 text-base font-semibold"
                                icon={<HiOutlineHeart className="text-lg" />}
                            >
                                Odontograma
                            </IconText>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Clic en un diente para abrirlo en grande. Con una
                            convención seleccionada, el clic pinta esa cara.
                            Hover muestra M/O/D/B/L.
                        </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0">
                        <Segment
                            value={[dentition]}
                            size="sm"
                            onChange={(val) => {
                                const next = Array.isArray(val) ? val[0] : val
                                if (next === 'permanent' || next === 'primary') {
                                    setDentition(next)
                                }
                            }}
                        >
                            <Segment.Item value="permanent">
                                Permanente
                            </Segment.Item>
                            <Segment.Item value="primary">
                                Temporal
                            </Segment.Item>
                        </Segment>
                        {canWrite && (
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiPlusCircle />}
                                onClick={() => openCreate()}
                            >
                                Nueva entrada
                            </Button>
                        )}
                    </div>
                </div>

                <OdontogramToolbar
                    canWrite={canWrite}
                    activeCondition={activeCondition}
                    activeStatus={activeStatus}
                    onConditionChange={setActiveCondition}
                    onStatusChange={setActiveStatus}
                />

                <OdontogramChart
                    dentition={dentition}
                    entriesByTooth={entriesByTooth}
                    paintMode={Boolean(activeCondition)}
                    onSurfaceClick={handleSurfaceClick}
                    onToothClick={handleToothClick}
                />

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 mt-4">
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
                                            Elige una convención y pinta, o
                                            selecciona una pieza.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>

            <ToothLabDialog
                tooth={labTooth}
                entries={labTooth ? entriesByTooth.get(labTooth) || [] : []}
                canWrite={canWrite}
                paintMode={Boolean(activeCondition)}
                onClose={() => setLabTooth(null)}
                onSurfaceClick={handleLabSurfaceClick}
                onToothClick={handleLabToothClick}
            />

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
                                    tooth: e.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 2),
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
                                                      (item) =>
                                                          item !== surface,
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
