import { useEffect, useMemo, useState } from 'react'
import {
    Button,
    DatePicker,
    Dialog,
    Input,
    Select,
} from '@/components/ui'
import { apiGetPatients } from '@/services/PatientService'
import { statusOptions } from '../constants'
import type { Appointment, AppointmentStatus } from '@/@types/appointment'
import type { Patient } from '@/@types/patient'

type PatientOption = { value: number; label: string }

export type AppointmentForm = {
    id?: number
    patientId?: number
    start: Date | null
    end: Date | null
    status: AppointmentStatus
    reason: string
    notes: string
}

type AppointmentDialogProps = {
    isOpen: boolean
    saving: boolean
    canDelete: boolean
    form: AppointmentForm
    onChange: (form: AppointmentForm) => void
    onClose: () => void
    onSave: () => void
    onDelete: () => void
}

const toOption = (patient: Patient): PatientOption => ({
    value: patient.id,
    label: `${patient.lastName}, ${patient.firstName} (${patient.recordNumber})`,
})

const AppointmentDialog = ({
    isOpen,
    saving,
    canDelete,
    form,
    onChange,
    onClose,
    onSave,
    onDelete,
}: AppointmentDialogProps) => {
    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])

    useEffect(() => {
        if (!isOpen) {
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const { data } = await apiGetPatients({ page: 1, size: 50 })
                if (!cancelled) {
                    setPatientOptions(data.data.map(toOption))
                }
            } catch {
                if (!cancelled) {
                    setPatientOptions([])
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [isOpen])

    const selectedPatient = useMemo(
        () => patientOptions.filter((option) => option.value === form.patientId),
        [patientOptions, form.patientId],
    )

    const searchPatients = async (input: string) => {
        try {
            const { data } = await apiGetPatients({
                q: input,
                page: 1,
                size: 20,
            })
            setPatientOptions(data.data.map(toOption))
        } catch {
            /* keep previous options */
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={560}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <h5 className="mb-4">{form.id ? 'Editar cita' : 'Nueva cita'}</h5>
            <div className="flex flex-col gap-3">
                <div>
                    <div className="mb-1 font-semibold">Paciente</div>
                    <Select
                        isSearchable
                        placeholder="Buscar paciente"
                        options={patientOptions}
                        value={selectedPatient}
                        onInputChange={(value, meta) => {
                            if (meta.action === 'input-change') {
                                searchPatients(value)
                            }
                        }}
                        onChange={(option) =>
                            onChange({
                                ...form,
                                patientId: option?.value,
                            })
                        }
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Inicio</div>
                        <DatePicker.DateTimepicker
                            amPm={false}
                            inputFormat="DD/MM/YYYY HH:mm"
                            value={form.start}
                            onChange={(date) =>
                                onChange({ ...form, start: date })
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Fin</div>
                        <DatePicker.DateTimepicker
                            amPm={false}
                            inputFormat="DD/MM/YYYY HH:mm"
                            value={form.end}
                            onChange={(date) =>
                                onChange({ ...form, end: date })
                            }
                        />
                    </div>
                </div>
                <div>
                    <div className="mb-1 font-semibold">Estado</div>
                    <Select
                        options={statusOptions}
                        value={statusOptions.filter(
                            (option) => option.value === form.status,
                        )}
                        onChange={(option) =>
                            onChange({
                                ...form,
                                status: (option?.value ||
                                    'SCHEDULED') as AppointmentStatus,
                            })
                        }
                    />
                </div>
                <div>
                    <div className="mb-1 font-semibold">Motivo</div>
                    <Input
                        placeholder="Limpieza, control, etc."
                        value={form.reason}
                        onChange={(e) =>
                            onChange({ ...form, reason: e.target.value })
                        }
                    />
                </div>
                <div>
                    <div className="mb-1 font-semibold">Notas</div>
                    <Input
                        textArea
                        placeholder="Observaciones de la cita"
                        value={form.notes}
                        onChange={(e) =>
                            onChange({ ...form, notes: e.target.value })
                        }
                    />
                </div>
                <div className="flex justify-between mt-2">
                    {form.id && canDelete ? (
                        <Button
                            variant="plain"
                            className="text-red-500"
                            onClick={onDelete}
                        >
                            Eliminar
                        </Button>
                    ) : (
                        <span />
                    )}
                    <div>
                        <Button className="mr-2" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={saving}
                            disabled={!form.patientId || !form.start || !form.end}
                            onClick={onSave}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}

export default AppointmentDialog
