import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import IconText from '@/components/shared/IconText'
import TableRowActions from '@/components/shared/TableRowActions'
import ReportPreviewModal from '@/components/reports/ReportPreviewModal'
import {
    Button,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import { HiOutlineDocumentText, HiPlusCircle } from 'react-icons/hi'
import {
    PRESCRIPTIONS_DELETE,
    PRESCRIPTIONS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import { apiGetMedications } from '@/services/MedicationService'
import {
    apiCreatePrescription,
    apiDeletePrescription,
    apiGetPrescriptions,
    apiUpdatePrescription,
} from '@/services/PrescriptionService'
import type { Medication } from '@/@types/medication'
import type { Prescription, PrescriptionPayload } from '@/@types/prescription'

type PrescriptionForm = {
    id?: number
    medicationId?: number
    drug: string
    dose: string
    frequency: string
    duration: string
    instructions: string
    notes: string
}

const emptyForm: PrescriptionForm = {
    drug: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
    notes: '',
}

type PatientPrescriptionsProps = {
    patientId: number
}

const PatientPrescriptions = ({ patientId }: PatientPrescriptionsProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PRESCRIPTIONS_WRITE])
    const canDelete = useAuthority(userAuthority, [PRESCRIPTIONS_DELETE])

    const [items, setItems] = useState<Prescription[]>([])
    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<PrescriptionForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Prescription | null>(null)
    const [printPrescriptionId, setPrintPrescriptionId] = useState<number | null>(
        null,
    )

    const loadPrescriptions = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetPrescriptions(patientId)
            setItems(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener las recetas')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId])

    const loadMedications = useCallback(async () => {
        try {
            const { data } = await apiGetMedications({
                active: true,
                size: 200,
            })
            setMedications(data.data)
        } catch {
            setMedications([])
        }
    }, [])

    useEffect(() => {
        loadPrescriptions()
        loadMedications()
    }, [loadPrescriptions, loadMedications])

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (item: Prescription) => {
        setForm({
            id: item.id,
            medicationId: item.medicationId ?? undefined,
            drug: item.drug,
            dose: item.dose ?? '',
            frequency: item.frequency ?? '',
            duration: item.duration ?? '',
            instructions: item.instructions ?? '',
            notes: item.notes ?? '',
        })
        setDialogOpen(true)
    }

    const applyMedication = (medicationId?: number) => {
        const medication = medications.find((item) => item.id === medicationId)
        if (!medication) {
            setForm((prev) => ({ ...prev, medicationId: undefined }))
            return
        }
        setForm((prev) => ({
            ...prev,
            medicationId: medication.id,
            drug: medication.name,
            dose: medication.dose ?? '',
            frequency: medication.frequency ?? '',
            duration: medication.duration ?? '',
            instructions: medication.instructions ?? '',
        }))
    }

    const savePrescription = async () => {
        if (!form.drug.trim()) {
            return
        }
        setSaving(true)
        try {
            const payload: PrescriptionPayload = {
                patientId,
                drug: form.drug.trim(),
                dose: form.dose || null,
                frequency: form.frequency || null,
                duration: form.duration || null,
                instructions: form.instructions || null,
                notes: form.notes || null,
                medicationId: form.medicationId ?? null,
            }
            if (form.id) {
                await apiUpdatePrescription(form.id, payload)
            } else {
                await apiCreatePrescription(payload)
            }
            setDialogOpen(false)
            await loadPrescriptions()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar la receta')}
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
            await apiDeletePrescription(toDelete.id)
            setToDelete(null)
            await loadPrescriptions()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar la receta')}
                </Notification>,
            )
        }
    }

    const medicationOptions = medications.map((medication) => ({
        value: medication.id,
        label: `${medication.code} · ${medication.name}${
            medication.dose ? ` · ${medication.dose}` : ''
        }`,
    }))

    return (
        <>
            <ReportPreviewModal
                isOpen={printPrescriptionId != null}
                onClose={() => setPrintPrescriptionId(null)}
                kind="prescription"
                prescriptionId={printPrescriptionId ?? undefined}
                downloadFilename={`receta-${printPrescriptionId}.pdf`}
            />
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className="mb-1 text-base font-semibold"
                            icon={<HiOutlineDocumentText className="text-lg" />}
                        >
                            Recetas
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Prescripciones del paciente desde el catálogo de
                            medicamentos.
                        </p>
                    </div>
                    {canWrite && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            className="mt-3 lg:mt-0"
                            onClick={openCreate}
                        >
                            Nueva receta
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left bg-gray-50 dark:bg-gray-700/40">
                                <th className="py-3 px-4">Medicamento</th>
                                <th className="py-3 px-3">Dosis</th>
                                <th className="py-3 px-3">Frecuencia</th>
                                <th className="py-3 px-3">Duración</th>
                                <th className="py-3 px-3">Fecha</th>
                                <th className="py-3 px-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-t border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 px-4">
                                        <div className="font-semibold">
                                            {item.drug}
                                        </div>
                                        {item.instructions && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.instructions}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-3">
                                        {item.dose || '—'}
                                    </td>
                                    <td className="py-3 px-3">
                                        {item.frequency || '—'}
                                    </td>
                                    <td className="py-3 px-3">
                                        {item.duration || '—'}
                                    </td>
                                    <td className="py-3 px-3">
                                        {dayjs(item.prescribedAt).format(
                                            'DD/MM/YYYY',
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <TableRowActions
                                            viewTitle="Imprimir"
                                            editTitle="Editar"
                                            deleteTitle="Eliminar"
                                            onView={() =>
                                                setPrintPrescriptionId(item.id)
                                            }
                                            onEdit={
                                                canWrite
                                                    ? () => openEdit(item)
                                                    : undefined
                                            }
                                            onDelete={
                                                canDelete
                                                    ? () => setToDelete(item)
                                                    : undefined
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td
                                        className="py-12 px-4 text-center"
                                        colSpan={6}
                                    >
                                        <p className="font-semibold mb-1">
                                            Sin recetas
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Crea una receta desde el catálogo de
                                            medicamentos.
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
                accent="amber"
                icon={<HiOutlineDocumentText />}
                title={form.id ? 'Editar receta' : 'Nueva receta'}
                saving={saving}
                saveDisabled={!form.drug.trim()}
                onClose={() => setDialogOpen(false)}
                onSave={savePrescription}
            >
                <div className="flex flex-col gap-3">
                    {medications.length > 0 && (
                        <div>
                            <div className="mb-1 font-semibold">
                                Medicamento del catálogo
                            </div>
                            <Select
                                isClearable
                                placeholder="Seleccionar medicamento"
                                options={medicationOptions}
                                value={medicationOptions.filter(
                                    (option) =>
                                        option.value === form.medicationId,
                                )}
                                onChange={(option) =>
                                    applyMedication(option?.value)
                                }
                            />
                        </div>
                    )}
                    <div>
                        <div className="mb-1 font-semibold">Medicamento</div>
                        <Input
                            placeholder="Amoxicilina"
                            value={form.drug}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    drug: e.target.value,
                                    medicationId: undefined,
                                }))
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 font-semibold">Dosis</div>
                            <Input
                                placeholder="500 mg"
                                value={form.dose}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        dose: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <div className="mb-1 font-semibold">Frecuencia</div>
                            <Input
                                placeholder="Cada 8 h"
                                value={form.frequency}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        frequency: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Duración</div>
                        <Input
                            placeholder="7 días"
                            value={form.duration}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    duration: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Indicaciones</div>
                        <Input
                            textArea
                            placeholder="Tomar con alimentos"
                            value={form.instructions}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    instructions: e.target.value,
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
                title="Eliminar receta"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar la receta de{' '}
                    <span className="font-semibold">{toDelete?.drug}</span>?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientPrescriptions
