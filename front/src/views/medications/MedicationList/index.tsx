import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DataTable from '@/components/shared/DataTable'
import FormDrawer from '@/components/shared/FormDrawer'
import PageHeader from '@/components/shared/PageHeader'
import TableRowActions from '@/components/shared/TableRowActions'
import {
    Button,
    Input,
    Notification,
    Segment,
    Switcher,
    Tag,
    toast,
} from '@/components/ui'
import {
    HiOutlineDocumentText,
    HiOutlineSearch,
    HiPlusCircle,
} from 'react-icons/hi'
import debounce from 'lodash/debounce'
import {
    PRESCRIPTIONS_DELETE,
    PRESCRIPTIONS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateMedication,
    apiDeleteMedication,
    apiGetMedications,
    apiUpdateMedication,
} from '@/services/MedicationService'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Medication } from '@/@types/medication'

type TableState = {
    pageIndex: number
    pageSize: number
    query: string
    sort: OnSortParam
    activeFilter: 'all' | 'active' | 'inactive'
}

type MedicationForm = {
    id?: number
    code: string
    name: string
    form: string
    dose: string
    frequency: string
    duration: string
    instructions: string
    active: boolean
}

const emptyForm: MedicationForm = {
    code: '',
    name: '',
    form: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
    active: true,
}

const formatRegimen = (medication: Medication) => {
    const parts = [medication.dose, medication.frequency, medication.duration]
        .map((value) => value?.trim())
        .filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : '—'
}

const MedicationList = () => {
    const { textTheme } = useThemeClass()
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PRESCRIPTIONS_WRITE])
    const canDelete = useAuthority(userAuthority, [PRESCRIPTIONS_DELETE])

    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [tableData, setTableData] = useState<TableState>({
        pageIndex: 1,
        pageSize: 20,
        query: '',
        sort: { order: '', key: '' },
        activeFilter: 'all',
    })
    const [form, setForm] = useState<MedicationForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Medication | null>(null)

    const fetchMedications = useCallback(async () => {
        setLoading(true)
        try {
            const sort =
                tableData.sort.order && tableData.sort.key
                    ? `${tableData.sort.key},${tableData.sort.order}`
                    : undefined
            const active =
                tableData.activeFilter === 'all'
                    ? undefined
                    : tableData.activeFilter === 'active'
            const response = await apiGetMedications({
                q: tableData.query,
                page: tableData.pageIndex,
                size: tableData.pageSize,
                sort,
                active,
            })
            setMedications(response.data.data)
            setTotal(response.data.total)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener el catálogo',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [tableData])

    useEffect(() => {
        fetchMedications()
    }, [fetchMedications, clinicId])

    const onSearchRef = useRef((query: string) => {
        setTableData((prev) => ({ ...prev, query, pageIndex: 1 }))
    })
    onSearchRef.current = (query: string) => {
        setTableData((prev) => ({ ...prev, query, pageIndex: 1 }))
    }
    const debounceSearch = useMemo(
        () =>
            debounce((value: string) => {
                onSearchRef.current(value)
            }, 400),
        [],
    )
    useEffect(() => () => debounceSearch.cancel(), [debounceSearch])

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (medication: Medication) => {
        setForm({
            id: medication.id,
            code: medication.code,
            name: medication.name,
            form: medication.form ?? '',
            dose: medication.dose ?? '',
            frequency: medication.frequency ?? '',
            duration: medication.duration ?? '',
            instructions: medication.instructions ?? '',
            active: medication.active,
        })
        setDialogOpen(true)
    }

    const saveMedication = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            return
        }
        setSaving(true)
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                form: form.form.trim() || null,
                dose: form.dose.trim() || null,
                frequency: form.frequency.trim() || null,
                duration: form.duration.trim() || null,
                instructions: form.instructions.trim() || null,
                active: form.active,
            }
            if (form.id) {
                await apiUpdateMedication(form.id, payload)
            } else {
                await apiCreateMedication(payload)
            }
            setDialogOpen(false)
            await fetchMedications()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(
                        error,
                        'Error al guardar el medicamento',
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
            await apiDeleteMedication(toDelete.id)
            setToDelete(null)
            await fetchMedications()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(
                        error,
                        'Error al eliminar el medicamento',
                    )}
                </Notification>,
            )
        }
    }

    const columns: ColumnDef<Medication>[] = useMemo(
        () => [
            {
                header: 'Medicamento',
                accessorKey: 'code',
                cell: (props) => {
                    const medication = props.row.original
                    return (
                        <div className="py-1">
                            {canWrite ? (
                                <button
                                    type="button"
                                    className={`font-semibold hover:underline ${textTheme}`}
                                    onClick={() => openEdit(medication)}
                                >
                                    {medication.code}
                                </button>
                            ) : (
                                <div className="font-semibold">
                                    {medication.code}
                                </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {medication.name}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Forma',
                accessorKey: 'form',
                cell: (props) => props.row.original.form || '—',
            },
            {
                header: 'Pauta',
                id: 'regimen',
                enableSorting: false,
                cell: (props) => (
                    <span className="text-sm">
                        {formatRegimen(props.row.original)}
                    </span>
                ),
            },
            {
                header: 'Estado',
                accessorKey: 'active',
                enableSorting: false,
                cell: (props) => (
                    <Tag
                        className={
                            props.row.original.active
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-0'
                        }
                    >
                        {props.row.original.active ? 'Activo' : 'Inactivo'}
                    </Tag>
                ),
            },
            {
                header: '',
                id: 'actions',
                enableSorting: false,
                cell: (props) => {
                    const medication = props.row.original
                    return (
                        <TableRowActions
                            editTitle="Editar"
                            deleteTitle="Eliminar"
                            onEdit={
                                canWrite
                                    ? () => openEdit(medication)
                                    : undefined
                            }
                            onDelete={
                                canDelete
                                    ? () => setToDelete(medication)
                                    : undefined
                            }
                        />
                    )
                },
            },
        ],
        [canWrite, canDelete, textTheme],
    )

    return (
        <>
            <PageHeader
                title="Medicamentos"
                subtitle="Catálogo"
                info="Define medicamentos para reutilizar al emitir recetas."
                chips={
                    total > 0
                        ? [`${total} ítem${total === 1 ? '' : 's'}`]
                        : undefined
                }
            />
            <AdaptableCard className="h-full" bodyClass="h-full p-0">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-2 mb-5">
                        <Segment
                            size="sm"
                            value={[tableData.activeFilter]}
                            onChange={(value) =>
                                setTableData((prev) => ({
                                    ...prev,
                                    activeFilter: (Array.isArray(value)
                                        ? value[0]
                                        : value) as TableState['activeFilter'],
                                    pageIndex: 1,
                                }))
                            }
                        >
                            <Segment.Item value="all">Todos</Segment.Item>
                            <Segment.Item value="active">Activos</Segment.Item>
                            <Segment.Item value="inactive">
                                Inactivos
                            </Segment.Item>
                        </Segment>
                        <Input
                            className="lg:w-64"
                            size="sm"
                            placeholder="Buscar código o nombre..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={(e) => debounceSearch(e.target.value)}
                        />
                        {canWrite && (
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiPlusCircle />}
                                onClick={openCreate}
                            >
                                Nuevo
                            </Button>
                        )}
                </div>
                {!loading && medications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="font-semibold mb-1">Sin medicamentos</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            No hay ítems para este filtro. Ajusta la búsqueda o
                            crea uno nuevo.
                        </p>
                        {canWrite && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={openCreate}
                            >
                                Nuevo medicamento
                            </Button>
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={medications}
                        loading={loading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex,
                            pageSize: tableData.pageSize,
                        }}
                        onPaginationChange={(page) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageIndex: page,
                            }))
                        }
                        onSelectChange={(size) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageSize: size,
                                pageIndex: 1,
                            }))
                        }
                        onSort={(sort) =>
                            setTableData((prev) => ({
                                ...prev,
                                sort,
                                pageIndex: 1,
                            }))
                        }
                    />
                )}
            </AdaptableCard>

            <FormDrawer
                isOpen={dialogOpen}
                accent="amber"
                icon={<HiOutlineDocumentText />}
                title={
                    form.id ? 'Editar medicamento' : 'Nuevo medicamento'
                }
                subtitle={
                    <Tag
                        className={
                            form.active
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-0'
                        }
                    >
                        {form.active ? 'Activo' : 'Inactivo'}
                    </Tag>
                }
                saving={saving}
                onClose={() => setDialogOpen(false)}
                onSave={saveMedication}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Código</div>
                        <Input
                            placeholder="AMOX500"
                            value={form.code}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    code: e.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Nombre</div>
                        <Input
                            placeholder="Amoxicilina"
                            value={form.name}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Forma</div>
                        <Input
                            placeholder="Cápsula, jarabe..."
                            value={form.form}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    form: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1.5 text-sm font-semibold">
                                Dosis
                            </div>
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
                            <div className="mb-1.5 text-sm font-semibold">
                                Frecuencia
                            </div>
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
                        <div className="mb-1.5 text-sm font-semibold">
                            Duración
                        </div>
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
                        <div className="mb-1.5 text-sm font-semibold">
                            Indicaciones
                        </div>
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
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3">
                        <span className="text-sm font-semibold">Activo</span>
                        <Switcher
                            checked={form.active}
                            onChange={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    active: !prev.active,
                                }))
                            }
                        />
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar medicamento"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar{' '}
                    <span className="font-semibold">
                        {toDelete?.code} · {toDelete?.name}
                    </span>
                    ? No se puede si ya hay recetas que lo usan.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default MedicationList
