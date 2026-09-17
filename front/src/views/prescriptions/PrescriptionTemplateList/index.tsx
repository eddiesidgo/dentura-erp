import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import PageHeader from '@/components/shared/PageHeader'
import {
    Button,
    Input,
    Notification,
    Switcher,
    toast,
} from '@/components/ui'
import { HiOutlineDocumentDuplicate, HiPlusCircle } from 'react-icons/hi'
import {
    PRESCRIPTIONS_DELETE,
    PRESCRIPTIONS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreatePrescriptionTemplate,
    apiDeletePrescriptionTemplate,
    apiGetPrescriptionTemplates,
    apiUpdatePrescriptionTemplate,
} from '@/services/PrescriptionService'
import type { PrescriptionTemplate } from '@/@types/prescription'

type TemplateForm = {
    id?: number
    drug: string
    dose: string
    frequency: string
    duration: string
    instructions: string
    active: boolean
}

const emptyForm: TemplateForm = {
    drug: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
    active: true,
}

const PrescriptionTemplateList = () => {
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PRESCRIPTIONS_WRITE])
    const canDelete = useAuthority(userAuthority, [PRESCRIPTIONS_DELETE])

    const [items, setItems] = useState<PrescriptionTemplate[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<TemplateForm>(emptyForm)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<PrescriptionTemplate | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetPrescriptionTemplates()
            setItems(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al cargar plantillas')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [clinicId])

    useEffect(() => {
        load()
    }, [load])

    const save = async () => {
        if (!form.drug.trim()) {
            toast.push(
                <Notification type="warning" title="Datos incompletos">
                    El medicamento es obligatorio
                </Notification>,
            )
            return
        }
        setSaving(true)
        try {
            const payload = {
                drug: form.drug.trim(),
                dose: form.dose.trim() || null,
                frequency: form.frequency.trim() || null,
                duration: form.duration.trim() || null,
                instructions: form.instructions.trim() || null,
                active: form.active,
            }
            if (form.id) {
                await apiUpdatePrescriptionTemplate(form.id, payload)
            } else {
                await apiCreatePrescriptionTemplate(payload)
            }
            setOpen(false)
            setForm(emptyForm)
            load()
            toast.push(
                <Notification type="success" title="Plantilla guardada">
                    Se guardó correctamente
                </Notification>,
            )
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

    const remove = async () => {
        if (!toDelete) return
        try {
            await apiDeletePrescriptionTemplate(toDelete.id)
            setToDelete(null)
            load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar')}
                </Notification>,
            )
        }
    }

    return (
        <>
            <PageHeader
                title="Plantillas de receta"
                subtitle="Recetas"
                info="Reutiliza esquemas frecuentes al emitir recetas en la ficha del paciente."
            />
            <AdaptableCard>
                <div className="mb-4 flex justify-between gap-3">
                    <p className="text-sm text-slate-500">
                        {loading
                            ? 'Cargando…'
                            : `${items.length} plantilla${items.length === 1 ? '' : 's'}`}
                    </p>
                    {canWrite && (
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlusCircle />}
                            onClick={() => {
                                setForm(emptyForm)
                                setOpen(true)
                            }}
                        >
                            Nueva plantilla
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                        >
                            <div>
                                <div className="font-medium">{item.drug}</div>
                                <div className="text-sm text-slate-500">
                                    {[item.dose, item.frequency, item.duration]
                                        .filter(Boolean)
                                        .join(' · ') || 'Sin régimen'}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {canWrite && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setForm({
                                                id: item.id,
                                                drug: item.drug,
                                                dose: item.dose || '',
                                                frequency: item.frequency || '',
                                                duration: item.duration || '',
                                                instructions:
                                                    item.instructions || '',
                                                active: item.active,
                                            })
                                            setOpen(true)
                                        }}
                                    >
                                        Editar
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => setToDelete(item)}
                                    >
                                        Eliminar
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && items.length === 0 && (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Aún no hay plantillas.
                        </p>
                    )}
                </div>
            </AdaptableCard>

            <FormDrawer
                isOpen={open}
                accent="indigo"
                icon={<HiOutlineDocumentDuplicate />}
                title={form.id ? 'Editar plantilla' : 'Nueva plantilla'}
                saving={saving}
                onClose={() => setOpen(false)}
                onSave={save}
            >
                <div className="space-y-3">
                    <Input
                        placeholder="Medicamento"
                        value={form.drug}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, drug: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Dosis"
                        value={form.dose}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, dose: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Frecuencia"
                        value={form.frequency}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                frequency: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Duración"
                        value={form.duration}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                duration: e.target.value,
                            }))
                        }
                    />
                    <Input
                        textArea
                        placeholder="Indicaciones"
                        value={form.instructions}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                instructions: e.target.value,
                            }))
                        }
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Activa</span>
                        <Switcher
                            checked={form.active}
                            onChange={(checked) =>
                                setForm((f) => ({ ...f, active: checked }))
                            }
                        />
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar plantilla"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={remove}
            >
                <p>¿Eliminar la plantilla {toDelete?.drug}?</p>
            </ConfirmDialog>
        </>
    )
}

export default PrescriptionTemplateList
