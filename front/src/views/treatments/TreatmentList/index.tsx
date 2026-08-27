import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DataTable from '@/components/shared/DataTable'
import FormNumericInput from '@/components/shared/FormNumericInput'
import {
    Button,
    Dialog,
    Input,
    Notification,
    Switcher,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineSearch, HiPlusCircle } from 'react-icons/hi'
import debounce from 'lodash/debounce'
import {
    CATALOG_DELETE,
    CATALOG_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateTreatment,
    apiDeleteTreatment,
    apiGetTreatments,
    apiUpdateTreatment,
} from '@/services/TreatmentService'
import { formatMoney } from '@/views/patients/works.constants'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Treatment } from '@/@types/treatment'

type TableState = {
    pageIndex: number
    pageSize: number
    query: string
    sort: OnSortParam
}

type TreatmentForm = {
    id?: number
    code: string
    name: string
    price: number
    active: boolean
}

const emptyForm: TreatmentForm = {
    code: '',
    name: '',
    price: 0,
    active: true,
}

const TreatmentList = () => {
    const { pageTitleTheme } = useThemeClass()
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [CATALOG_WRITE])
    const canDelete = useAuthority(userAuthority, [CATALOG_DELETE])

    const [treatments, setTreatments] = useState<Treatment[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [tableData, setTableData] = useState<TableState>({
        pageIndex: 1,
        pageSize: 20,
        query: '',
        sort: { order: '', key: '' },
    })
    const [form, setForm] = useState<TreatmentForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Treatment | null>(null)

    const fetchTreatments = useCallback(async () => {
        setLoading(true)
        try {
            const sort =
                tableData.sort.order && tableData.sort.key
                    ? `${tableData.sort.key},${tableData.sort.order}`
                    : undefined
            const response = await apiGetTreatments({
                q: tableData.query,
                page: tableData.pageIndex,
                size: tableData.pageSize,
                sort,
            })
            setTreatments(response.data.data)
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
        fetchTreatments()
    }, [fetchTreatments, clinicId])

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

    const openEdit = (treatment: Treatment) => {
        setForm({
            id: treatment.id,
            code: treatment.code,
            name: treatment.name,
            price: treatment.price,
            active: treatment.active,
        })
        setDialogOpen(true)
    }

    const saveTreatment = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            return
        }
        setSaving(true)
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                price: form.price ?? 0,
                active: form.active,
            }
            if (form.id) {
                await apiUpdateTreatment(form.id, payload)
            } else {
                await apiCreateTreatment(payload)
            }
            setDialogOpen(false)
            await fetchTreatments()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar el tratamiento')}
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
            await apiDeleteTreatment(toDelete.id)
            setToDelete(null)
            await fetchTreatments()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el tratamiento')}
                </Notification>,
            )
        }
    }

    const columns: ColumnDef<Treatment>[] = useMemo(
        () => [
            {
                header: 'Código',
                accessorKey: 'code',
                cell: (props) => (
                    <span className="font-semibold">
                        {props.row.original.code}
                    </span>
                ),
            },
            {
                header: 'Tratamiento',
                accessorKey: 'name',
            },
            {
                header: 'Precio',
                accessorKey: 'price',
                cell: (props) => formatMoney(props.row.original.price),
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
                    const treatment = props.row.original
                    if (!canWrite && !canDelete) {
                        return null
                    }
                    return (
                        <div className="flex justify-end gap-2">
                            {canWrite && (
                                <Button
                                    size="sm"
                                    onClick={() => openEdit(treatment)}
                                >
                                    Editar
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    size="sm"
                                    onClick={() => setToDelete(treatment)}
                                >
                                    <span className="text-red-500">Eliminar</span>
                                </Button>
                            )}
                        </div>
                    )
                },
            },
        ],
        [canWrite, canDelete],
    )

    return (
        <>
            <AdaptableCard className="h-full" bodyClass="h-full">
                <div className="lg:flex items-center justify-between mb-4">
                    <div>
                        <h5 className={pageTitleTheme}>
                            Catálogo de tratamientos
                        </h5>
                        <p className="text-sm">
                            Lista inicial tomada de GestOdon. Completa los
                            precios de tu clínica; el plan del paciente usa este
                            catálogo.
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 mt-3 lg:mt-0">
                        <Input
                            className="lg:w-72"
                            size="sm"
                            placeholder="Buscar por código o nombre..."
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
                                Nuevo tratamiento
                            </Button>
                        )}
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={treatments}
                    loading={loading}
                    pagingData={{
                        total,
                        pageIndex: tableData.pageIndex,
                        pageSize: tableData.pageSize,
                    }}
                    onPaginationChange={(page) =>
                        setTableData((prev) => ({ ...prev, pageIndex: page }))
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
            </AdaptableCard>

            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-4">
                    {form.id ? 'Editar tratamiento' : 'Nuevo tratamiento'}
                </h5>
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Código</div>
                        <Input
                            placeholder="CONS"
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
                        <div className="mb-1 font-semibold">Nombre</div>
                        <Input
                            placeholder="Consulta"
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
                        <div className="mb-1 font-semibold">Precio</div>
                        <FormNumericInput
                            value={form.price}
                            decimalScale={2}
                            inputPrefix="$"
                            placeholder="0.00"
                            onValueChange={(values) =>
                                setForm((prev) => ({
                                    ...prev,
                                    price: values.floatValue ?? 0,
                                }))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Activo</span>
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
                    <div className="text-right mt-2">
                        <Button
                            className="mr-2"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={saving}
                            onClick={saveTreatment}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar tratamiento"
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
                    ? No se puede si ya hay trabajos que lo usan.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default TreatmentList
