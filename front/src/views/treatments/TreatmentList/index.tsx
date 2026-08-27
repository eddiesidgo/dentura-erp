import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DataTable from '@/components/shared/DataTable'
import FormNumericInput from '@/components/shared/FormNumericInput'
import IconText from '@/components/shared/IconText'
import TableRowActions from '@/components/shared/TableRowActions'
import {
    Button,
    Dialog,
    Input,
    Notification,
    Segment,
    Switcher,
    Tag,
    toast,
} from '@/components/ui'
import {
    HiOutlineClipboardList,
    HiOutlineSearch,
    HiPlusCircle,
} from 'react-icons/hi'
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
    activeFilter: 'all' | 'active' | 'inactive'
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
    const { pageTitleTheme, textTheme } = useThemeClass()
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
        activeFilter: 'all',
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
            const active =
                tableData.activeFilter === 'all'
                    ? undefined
                    : tableData.activeFilter === 'active'
            const response = await apiGetTreatments({
                q: tableData.query,
                page: tableData.pageIndex,
                size: tableData.pageSize,
                sort,
                active,
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
                header: 'Tratamiento',
                accessorKey: 'code',
                cell: (props) => {
                    const treatment = props.row.original
                    return (
                        <div className="py-1">
                            {canWrite ? (
                                <button
                                    type="button"
                                    className={`font-semibold hover:underline ${textTheme}`}
                                    onClick={() => openEdit(treatment)}
                                >
                                    {treatment.code}
                                </button>
                            ) : (
                                <div className="font-semibold">
                                    {treatment.code}
                                </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {treatment.name}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Precio',
                accessorKey: 'price',
                cell: (props) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(props.row.original.price)}
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
                    const treatment = props.row.original
                    return (
                        <TableRowActions
                            editTitle="Editar"
                            deleteTitle="Eliminar"
                            onEdit={
                                canWrite
                                    ? () => openEdit(treatment)
                                    : undefined
                            }
                            onDelete={
                                canDelete
                                    ? () => setToDelete(treatment)
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
            <AdaptableCard className="h-full" bodyClass="h-full p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className={`text-lg font-semibold mb-1 ${pageTitleTheme}`}
                            icon={
                                <HiOutlineClipboardList className="text-xl" />
                            }
                        >
                            Catálogo de tratamientos
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Completa precios de tu clínica. El plan del paciente
                            usa este catálogo.
                        </p>
                        {total > 0 && (
                            <Tag className="mt-3 border-0 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                                {total} ítem{total === 1 ? '' : 's'}
                            </Tag>
                        )}
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 mt-3 lg:mt-0">
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
                </div>
                {!loading && treatments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="font-semibold mb-1">Sin tratamientos</p>
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
                                Nuevo tratamiento
                            </Button>
                        )}
                    </div>
                ) : (
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

            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-5">
                    {form.id ? 'Editar tratamiento' : 'Nuevo tratamiento'}
                </h5>
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">Código</div>
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
                        <div className="mb-1.5 text-sm font-semibold">Nombre</div>
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
                        <div className="mb-1.5 text-sm font-semibold">Precio</div>
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
                    <div className="text-right mt-1">
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
