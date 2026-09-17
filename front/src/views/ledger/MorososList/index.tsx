import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdaptableCard from '@/components/shared/AdaptableCard'
import PageHeader from '@/components/shared/PageHeader'
import { Button, Notification, toast } from '@/components/ui'
import { getApiErrorMessage } from '@/services/PatientService'
import { apiGetMorosos } from '@/services/LedgerService'
import { formatMoney } from '@/views/patients/works.constants'
import type { Moroso } from '@/@types/ledger'

const MorososList = () => {
    const navigate = useNavigate()
    const [rows, setRows] = useState<Moroso[]>([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetMorosos()
            setRows(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al cargar morosos')}
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
                title="Morosos"
                subtitle="Cobranza"
                info="Pacientes con saldo positivo en cuenta corriente (cargos + ajustes − pagos)."
                chips={[`${rows.length} paciente${rows.length === 1 ? '' : 's'}`]}
            />
            <AdaptableCard>
                {loading ? (
                    <p className="text-sm text-slate-500">Cargando…</p>
                ) : rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No hay pacientes con saldo pendiente en el libro.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="px-2 py-2">Paciente</th>
                                    <th className="px-2 py-2">Expediente</th>
                                    <th className="px-2 py-2">Teléfono</th>
                                    <th className="px-2 py-2">Cargos</th>
                                    <th className="px-2 py-2">Pagos</th>
                                    <th className="px-2 py-2">Saldo</th>
                                    <th className="px-2 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={row.patientId}
                                        className="border-b border-slate-100 dark:border-slate-800"
                                    >
                                        <td className="px-2 py-2">
                                            {row.patientName}
                                        </td>
                                        <td className="px-2 py-2">
                                            {row.recordNumber}
                                        </td>
                                        <td className="px-2 py-2">
                                            {row.phone || '—'}
                                        </td>
                                        <td className="px-2 py-2 tabular-nums">
                                            {formatMoney(Number(row.chargesTotal))}
                                        </td>
                                        <td className="px-2 py-2 tabular-nums">
                                            {formatMoney(
                                                Number(row.paymentsTotal),
                                            )}
                                        </td>
                                        <td className="px-2 py-2 font-semibold tabular-nums text-amber-700">
                                            {formatMoney(Number(row.balance))}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <Button
                                                size="xs"
                                                onClick={() =>
                                                    navigate(
                                                        `/pacientes/${row.patientId}`,
                                                    )
                                                }
                                            >
                                                Ver ficha
                                            </Button>
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

export default MorososList
