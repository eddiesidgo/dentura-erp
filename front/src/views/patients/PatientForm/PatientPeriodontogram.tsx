import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import {
    Button,
    Input,
    Notification,
    toast,
} from '@/components/ui'
import { HiOutlineHeart, HiPlusCircle } from 'react-icons/hi'
import { ODONTOGRAM_DELETE, ODONTOGRAM_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreatePeriodontogramEntry,
    apiDeletePeriodontogramEntry,
    apiGetPeriodontogram,
    apiUpdatePeriodontogramEntry,
} from '@/services/ClinicalService'
import type { PeriodontogramEntry } from '@/@types/clinical'

type Props = { patientId: number }

type SiteKey = 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl'

type ProbingValues = Record<SiteKey, string>

const SITE_KEYS: SiteKey[] = ['mb', 'b', 'db', 'ml', 'l', 'dl']

const SITE_LABELS: Record<SiteKey, string> = {
    mb: 'MB',
    b: 'B',
    db: 'DB',
    ml: 'ML',
    l: 'L',
    dl: 'DL',
}

const emptyProbing = (): ProbingValues => ({
    mb: '',
    b: '',
    db: '',
    ml: '',
    l: '',
    dl: '',
})

const defaultProbing = (): ProbingValues => ({
    mb: '3',
    b: '2',
    db: '3',
    ml: '2',
    l: '2',
    dl: '3',
})

const parseValuesJson = (raw: string | null | undefined): ProbingValues => {
    const base = emptyProbing()
    if (!raw?.trim()) {
        return base
    }
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        for (const key of SITE_KEYS) {
            const value = parsed[key]
            if (value === null || value === undefined || value === '') {
                continue
            }
            base[key] = String(value)
        }
    } catch {
        // keep empty if legacy/invalid JSON
    }
    return base
}

const buildValuesJson = (values: ProbingValues): string | null => {
    const payload: Record<string, number> = {}
    let hasValue = false
    for (const key of SITE_KEYS) {
        const trimmed = values[key].trim()
        if (!trimmed) {
            continue
        }
        const num = Number(trimmed)
        if (Number.isNaN(num)) {
            throw new Error(`Valor inválido en ${SITE_LABELS[key]}`)
        }
        payload[key] = num
        hasValue = true
    }
    return hasValue ? JSON.stringify(payload) : null
}

const formatValues = (raw: string | null): string => {
    const values = parseValuesJson(raw)
    const parts = SITE_KEYS.filter((key) => values[key] !== '').map(
        (key) => `${SITE_LABELS[key]}:${values[key]}`,
    )
    if (parts.length === 0) {
        return raw?.trim() || '—'
    }
    return parts.join(' · ')
}

const PatientPeriodontogram = ({ patientId }: Props) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [ODONTOGRAM_WRITE])
    const canDelete = useAuthority(userAuthority, [ODONTOGRAM_DELETE])
    const [entries, setEntries] = useState<PeriodontogramEntry[]>([])
    const [editingId, setEditingId] = useState<number | null>(null)
    const [tooth, setTooth] = useState('16')
    const [probing, setProbing] = useState<ProbingValues>(defaultProbing)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        try {
            const { data } = await apiGetPeriodontogram(patientId)
            setEntries(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error periodontograma')}
                </Notification>,
            )
        }
    }, [patientId])

    useEffect(() => {
        load()
    }, [load])

    const resetForm = () => {
        setEditingId(null)
        setTooth('16')
        setProbing(defaultProbing())
        setNotes('')
    }

    const startEdit = (entry: PeriodontogramEntry) => {
        setEditingId(entry.id)
        setTooth(entry.tooth)
        setProbing(parseValuesJson(entry.valuesJson))
        setNotes(entry.notes || '')
    }

    const setSite = (key: SiteKey, value: string) => {
        setProbing((prev) => ({ ...prev, [key]: value }))
    }

    const save = async () => {
        if (!canWrite) {
            toast.push(
                <Notification type="warning" title="Sin permiso">
                    Necesitas odontogram.write para registrar mediciones.
                </Notification>,
            )
            return
        }
        if (!tooth.trim()) {
            toast.push(
                <Notification type="warning" title="Pieza requerida">
                    Indicá el número de pieza (FDI).
                </Notification>,
            )
            return
        }

        let valuesJson: string | null
        try {
            valuesJson = buildValuesJson(probing)
        } catch (error) {
            toast.push(
                <Notification type="warning" title="Valores inválidos">
                    {error instanceof Error
                        ? error.message
                        : 'Revisá las profundidades'}
                </Notification>,
            )
            return
        }

        setSaving(true)
        const payload = {
            patientId,
            tooth: tooth.trim(),
            valuesJson,
            notes: notes.trim() || null,
        }
        try {
            if (editingId) {
                await apiUpdatePeriodontogramEntry(editingId, payload)
                toast.push(
                    <Notification type="success" title="Actualizado">
                        Registro periodontal actualizado.
                    </Notification>,
                )
            } else {
                await apiCreatePeriodontogramEntry(payload)
                toast.push(
                    <Notification type="success" title="Agregado">
                        Registro periodontal guardado.
                    </Notification>,
                )
            }
            resetForm()
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const remove = async (id: number) => {
        try {
            await apiDeletePeriodontogramEntry(id)
            if (editingId === id) {
                resetForm()
            }
            await load()
            toast.push(
                <Notification type="success" title="Eliminado">
                    Registro eliminado.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar')}
                </Notification>,
            )
        }
    }

    return (
        <AdaptableCard className="mb-4" bodyClass="p-5">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold">
                <HiOutlineHeart />
                Periodontograma
            </div>

            {!canWrite && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    Solo lectura: tu rol no tiene permiso para agregar o editar
                    mediciones periodontales.
                </p>
            )}

            {canWrite && (
                <div className="mb-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        <Input
                            placeholder="Pieza FDI"
                            value={tooth}
                            onChange={(e) => setTooth(e.target.value)}
                        />
                        {SITE_KEYS.map((key) => (
                            <Input
                                key={key}
                                type="number"
                                min={0}
                                step={1}
                                placeholder={SITE_LABELS[key]}
                                value={probing[key]}
                                onChange={(e) => setSite(key, e.target.value)}
                            />
                        ))}
                    </div>
                    <Input
                        placeholder="Notas"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            loading={saving}
                            onClick={save}
                        >
                            {editingId ? 'Guardar cambios' : 'Agregar'}
                        </Button>
                        {editingId ? (
                            <Button
                                type="button"
                                variant="plain"
                                disabled={saving}
                                onClick={resetForm}
                            >
                                Cancelar edición
                            </Button>
                        ) : null}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-slate-500">
                            <th className="px-2 py-2">Pieza</th>
                            <th className="px-2 py-2">Profundidades</th>
                            <th className="px-2 py-2">Fecha</th>
                            <th className="px-2 py-2">Notas</th>
                            <th className="px-2 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr
                                key={entry.id}
                                className="border-b border-slate-100 dark:border-slate-800"
                            >
                                <td className="px-2 py-2 font-semibold">
                                    {entry.tooth}
                                </td>
                                <td className="px-2 py-2">
                                    {formatValues(entry.valuesJson)}
                                </td>
                                <td className="whitespace-nowrap px-2 py-2">
                                    {dayjs(entry.recordedAt).format(
                                        'DD/MM/YYYY',
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {entry.notes || '—'}
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="flex justify-end gap-1">
                                        {canWrite ? (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="plain"
                                                onClick={() =>
                                                    startEdit(entry)
                                                }
                                            >
                                                Editar
                                            </Button>
                                        ) : null}
                                        {canDelete ? (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="plain"
                                                className="text-red-500"
                                                onClick={() =>
                                                    remove(entry.id)
                                                }
                                            >
                                                Eliminar
                                            </Button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-2 py-8 text-center text-slate-500"
                                >
                                    Sin registros periodontales.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdaptableCard>
    )
}

export default PatientPeriodontogram
