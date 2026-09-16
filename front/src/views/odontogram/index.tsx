import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdaptableCard from '@/components/shared/AdaptableCard'
import PageHeader from '@/components/shared/PageHeader'
import { Button, Notification, Select, toast } from '@/components/ui'
import { HiOutlineHeart } from 'react-icons/hi'
import { ODONTOGRAM_READ } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import {
    apiGetPatient,
    apiGetPatients,
    getApiErrorMessage,
} from '@/services/PatientService'
import PatientOdontogram from '@/views/patients/PatientForm/PatientOdontogram'
import type { Patient } from '@/@types/patient'

type PatientOption = { value: number; label: string }

const toOption = (patient: Patient): PatientOption => ({
    value: patient.id,
    label: `${patient.lastName}, ${patient.firstName} (${patient.recordNumber})`,
})

const OdontogramPage = () => {
    const navigate = useNavigate()
    const { patientId: patientIdParam } = useParams()
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canRead = useAuthority(userAuthority, [ODONTOGRAM_READ])

    const patientId = patientIdParam ? Number(patientIdParam) : null
    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
    const [patientName, setPatientName] = useState<string>('')
    const [loadingPatient, setLoadingPatient] = useState(false)

    const loadOptions = useCallback(async (query = '') => {
        try {
            const { data } = await apiGetPatients({
                q: query || undefined,
                page: 1,
                size: 30,
                active: true,
            })
            setPatientOptions(data.data.map(toOption))
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al buscar pacientes',
                    )}
                </Notification>,
            )
        }
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    useEffect(() => {
        if (!patientId || Number.isNaN(patientId)) {
            setPatientName('')
            return
        }
        let cancelled = false
        const load = async () => {
            setLoadingPatient(true)
            try {
                const { data } = await apiGetPatient(patientId)
                if (!cancelled) {
                    setPatientName(
                        `${data.lastName}, ${data.firstName} · ${data.recordNumber}`,
                    )
                    setPatientOptions((prev) => {
                        const option = toOption(data)
                        if (prev.some((item) => item.value === option.value)) {
                            return prev
                        }
                        return [option, ...prev]
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    setPatientName('')
                    toast.push(
                        <Notification type="danger" title="Paciente no encontrado">
                            {getApiErrorMessage(
                                error,
                                'No se pudo abrir el odontograma',
                            )}
                        </Notification>,
                    )
                    navigate('/odontograma', { replace: true })
                }
            } finally {
                if (!cancelled) {
                    setLoadingPatient(false)
                }
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [patientId, navigate])

    const selected = useMemo(
        () =>
            patientOptions.filter(
                (option) => option.value === (patientId || undefined),
            ),
        [patientOptions, patientId],
    )

    if (!canRead) {
        return (
            <AdaptableCard bodyClass="p-8 text-center">
                <p className="font-semibold">Sin permiso de odontograma</p>
                <p className="mt-1 text-sm text-slate-500">
                    Necesitas el permiso odontogram.read para usar esta vista.
                </p>
            </AdaptableCard>
        )
    }

    return (
        <div>
            <PageHeader
                title="Odontograma"
                subtitle={
                    patientId && patientName
                        ? patientName
                        : 'Charting clínico'
                }
                info={
                    patientId && patientName
                        ? 'Vista dedicada con convenciones, dentición y detalle por pieza.'
                        : 'Selecciona un paciente para abrir su odontograma clínico.'
                }
            />

            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="w-full max-w-xl">
                        <div className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Paciente
                        </div>
                        <Select
                            placeholder="Buscar por nombre o expediente..."
                            options={patientOptions}
                            value={selected}
                            isLoading={loadingPatient}
                            onInputChange={(value, meta) => {
                                if (meta.action === 'input-change') {
                                    void loadOptions(value)
                                }
                            }}
                            onChange={(option) => {
                                if (option?.value) {
                                    navigate(`/odontograma/${option.value}`)
                                }
                            }}
                        />
                    </div>
                    {patientId && (
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => navigate('/odontograma')}
                        >
                            Cambiar paciente
                        </Button>
                    )}
                </div>
            </AdaptableCard>

            {!patientId && (
                <AdaptableCard bodyClass="p-10 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                        <HiOutlineHeart className="text-3xl" />
                    </div>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        ¿De qué paciente quieres ver el odontograma?
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Elige un paciente arriba. Luego verás el chart completo,
                        convenciones, dentición temporal/permanente y el
                        detalle ampliado de cada pieza.
                    </p>
                </AdaptableCard>
            )}

            {patientId && !Number.isNaN(patientId) && (
                <PatientOdontogram patientId={patientId} embedded />
            )}
        </div>
    )
}

export default OdontogramPage
