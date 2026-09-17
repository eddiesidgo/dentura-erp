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
} from '@/services/ClinicalService'
import type { PeriodontogramEntry } from '@/@types/clinical'

type Props = { patientId: number }

const PatientPeriodontogram = ({ patientId }: Props) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [ODONTOGRAM_WRITE])
    const canDelete = useAuthority(userAuthority, [ODONTOGRAM_DELETE])
    const [entries, setEntries] = useState<PeriodontogramEntry[]>([])
    const [tooth, setTooth] = useState('16')
    const [valuesJson, setValuesJson] = useState(
        '{"mb":3,"b":2,"db":3,"ml":2,"l":2,"dl":3}',
    )
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

    const save = async () => {
        if (!tooth.trim()) {
            return
        }
        setSaving(true)
        try {
            await apiCreatePeriodontogramEntry({
                patientId,
                tooth: tooth.trim(),
                valuesJson,
                notes: notes || null,
            })
            setNotes('')
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
            await load()
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
            {canWrite && (
                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Input
                        placeholder="Pieza FDI"
                        value={tooth}
                        onChange={(e) => setTooth(e.target.value)}
                    />
                    <Input
                        className="md:col-span-2"
                        placeholder='Valores JSON ej. {"mb":3,"b":2}'
                        value={valuesJson}
                        onChange={(e) => setValuesJson(e.target.value)}
                    />
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        loading={saving}
                        onClick={save}
                    >
                        Agregar
                    </Button>
                    <Input
                        className="md:col-span-4"
                        placeholder="Notas"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-slate-500">
                            <th className="px-2 py-2">Pieza</th>
                            <th className="px-2 py-2">Valores</th>
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
                                <td className="max-w-xs truncate px-2 py-2">
                                    {entry.valuesJson || '—'}
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
                                    {canDelete ? (
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            className="text-red-500"
                                            onClick={() => remove(entry.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    ) : null}
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
