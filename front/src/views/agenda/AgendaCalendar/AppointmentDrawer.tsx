import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormDrawer from '@/components/shared/FormDrawer'
import {
    Button,
    DatePicker,
    Input,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineCalendar } from 'react-icons/hi'
import { apiGetPatients, getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateProvider,
    apiCreateRoom,
    apiGetProviders,
    apiGetRooms,
} from '@/services/AppointmentService'
import { statusOptions, statusTagClass } from '../constants'
import type { AppointmentStatus, Provider, Room } from '@/@types/appointment'
import type { Patient } from '@/@types/patient'

type PatientOption = { value: number; label: string }
type IdOption = { value: number; label: string }

export type AppointmentForm = {
    id?: number
    patientId?: number
    providerId?: number
    roomId?: number | null
    start: Date | null
    end: Date | null
    status: AppointmentStatus
    reason: string
    notes: string
}

type AppointmentDrawerProps = {
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

const AppointmentDrawer = ({
    isOpen,
    saving,
    canDelete,
    form,
    onChange,
    onClose,
    onSave,
    onDelete,
}: AppointmentDrawerProps) => {
    const navigate = useNavigate()
    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
    const [providers, setProviders] = useState<Provider[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [newProviderName, setNewProviderName] = useState('')
    const [newRoomName, setNewRoomName] = useState('')
    const [addingResource, setAddingResource] = useState(false)

    const loadResources = async () => {
        try {
            const [providersRes, roomsRes] = await Promise.all([
                apiGetProviders(true),
                apiGetRooms(true),
            ])
            setProviders(providersRes.data)
            setRooms(roomsRes.data)
            if (!form.providerId && providersRes.data.length === 1) {
                onChange({ ...form, providerId: providersRes.data[0].id })
            }
        } catch {
            setProviders([])
            setRooms([])
        }
    }

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
            if (!cancelled) {
                await loadResources()
            }
        }
        load()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const selectedPatient = useMemo(
        () => patientOptions.filter((option) => option.value === form.patientId),
        [patientOptions, form.patientId],
    )

    const providerOptions: IdOption[] = providers.map((provider) => ({
        value: provider.id,
        label: provider.name,
    }))

    const roomOptions: IdOption[] = rooms.map((room) => ({
        value: room.id,
        label: room.name,
    }))

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

    const addProvider = async () => {
        const name = newProviderName.trim()
        if (!name) {
            return
        }
        setAddingResource(true)
        try {
            const { data } = await apiCreateProvider({ name })
            setNewProviderName('')
            setProviders((prev) => [...prev, data])
            onChange({ ...form, providerId: data.id })
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo crear profesional">
                    {getApiErrorMessage(error, 'Error al crear')}
                </Notification>,
            )
        } finally {
            setAddingResource(false)
        }
    }

    const addRoom = async () => {
        const name = newRoomName.trim()
        if (!name) {
            return
        }
        setAddingResource(true)
        try {
            const { data } = await apiCreateRoom({ name })
            setNewRoomName('')
            setRooms((prev) => [...prev, data])
            onChange({ ...form, roomId: data.id })
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo crear sala">
                    {getApiErrorMessage(error, 'Error al crear')}
                </Notification>,
            )
        } finally {
            setAddingResource(false)
        }
    }

    const statusTag = (
        <Tag className={statusTagClass[form.status]}>
            {statusOptions.find((option) => option.value === form.status)
                ?.label || form.status}
        </Tag>
    )

    return (
        <FormDrawer
            isOpen={isOpen}
            accent="sky"
            icon={<HiOutlineCalendar />}
            title={form.id ? 'Editar cita' : 'Nueva cita'}
            subtitle={statusTag}
            saving={saving}
            saveDisabled={
                !form.patientId ||
                !form.providerId ||
                !form.start ||
                !form.end
            }
            footerStart={
                <div className="flex items-center gap-2">
                    {form.id && canDelete ? (
                        <Button
                            variant="plain"
                            className="text-red-500"
                            onClick={onDelete}
                        >
                            Eliminar
                        </Button>
                    ) : null}
                    {form.patientId ? (
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() =>
                                navigate(`/pacientes/${form.patientId}`)
                            }
                        >
                            Ver ficha
                        </Button>
                    ) : null}
                </div>
            }
            onClose={onClose}
            onSave={onSave}
        >
            <div className="flex flex-col gap-4">
                <div>
                    <div className="mb-1.5 text-sm font-semibold">Paciente</div>
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
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="mb-3 text-sm font-semibold">Recursos</div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">
                                Profesional <span className="text-red-500">*</span>
                            </div>
                            <Select
                                placeholder="Seleccionar profesional"
                                options={providerOptions}
                                value={providerOptions.filter(
                                    (option) => option.value === form.providerId,
                                )}
                                onChange={(option) =>
                                    onChange({
                                        ...form,
                                        providerId: option?.value,
                                    })
                                }
                            />
                            {providers.length === 0 ? (
                                <div className="mt-2 flex gap-2">
                                    <Input
                                        size="sm"
                                        placeholder="Nombre del profesional"
                                        value={newProviderName}
                                        onChange={(e) =>
                                            setNewProviderName(e.target.value)
                                        }
                                    />
                                    <Button
                                        size="sm"
                                        loading={addingResource}
                                        onClick={addProvider}
                                    >
                                        Añadir
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">
                                Sala
                            </div>
                            <Select
                                isClearable
                                placeholder="Opcional"
                                options={roomOptions}
                                value={roomOptions.filter(
                                    (option) => option.value === form.roomId,
                                )}
                                onChange={(option) =>
                                    onChange({
                                        ...form,
                                        roomId: option?.value ?? null,
                                    })
                                }
                            />
                            {rooms.length === 0 ? (
                                <div className="mt-2 flex gap-2">
                                    <Input
                                        size="sm"
                                        placeholder="Nombre de la sala"
                                        value={newRoomName}
                                        onChange={(e) =>
                                            setNewRoomName(e.target.value)
                                        }
                                    />
                                    <Button
                                        size="sm"
                                        loading={addingResource}
                                        onClick={addRoom}
                                    >
                                        Añadir
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Inicio</div>
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
                        <div className="mb-1.5 text-sm font-semibold">Fin</div>
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
                    <div className="mb-1.5 text-sm font-semibold">Estado</div>
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
                    <div className="mb-1.5 text-sm font-semibold">Motivo</div>
                    <Input
                        placeholder="Limpieza, control, etc."
                        value={form.reason}
                        onChange={(e) =>
                            onChange({ ...form, reason: e.target.value })
                        }
                    />
                </div>
                <div>
                    <div className="mb-1.5 text-sm font-semibold">Notas</div>
                    <Input
                        textArea
                        placeholder="Observaciones de la cita"
                        value={form.notes}
                        onChange={(e) =>
                            onChange({ ...form, notes: e.target.value })
                        }
                    />
                </div>
            </div>
        </FormDrawer>
    )
}

export default AppointmentDrawer
