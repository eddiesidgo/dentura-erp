import { useCallback, useEffect, useMemo, useState } from 'react'
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
    Select,
    Switcher,
    Tag,
    toast,
} from '@/components/ui'
import { HiOutlineShare, HiPlusCircle } from 'react-icons/hi'
import {
    REFERRALS_DELETE,
    REFERRALS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateReferralSource,
    apiDeleteReferralSource,
    apiGetReferralSources,
    apiUpdateReferralSource,
} from '@/services/ReferralService'
import type { ColumnDef } from '@/components/shared/DataTable'
import type {
    ReferralSource,
    ReferralSourcePayload,
    ReferralSourceType,
} from '@/@types/referral'

type SourceForm = {
    id?: number
    name: string
    type: ReferralSourceType
    phone: string
    active: boolean
}

const emptyForm: SourceForm = {
    name: '',
    type: 'PERSON',
    phone: '',
    active: true,
}

const typeOptions: { value: ReferralSourceType; label: string }[] = [
    { value: 'PERSON', label: 'Persona' },
    { value: 'CLINIC', label: 'Clínica' },
    { value: 'OTHER', label: 'Otro' },
]

const typeLabel = (value: string) =>
    typeOptions.find((option) => option.value === value)?.label || value

const ReferralSourceList = () => {
    const { textTheme } = useThemeClass()
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [REFERRALS_WRITE])
    const canDelete = useAuthority(userAuthority, [REFERRALS_DELETE])

    const [sources, setSources] = useState<ReferralSource[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<SourceForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<ReferralSource | null>(null)

    const fetchSources = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetReferralSources()
            setSources(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener las fuentes de referido',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSources()
    }, [fetchSources, clinicId])

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (source: ReferralSource) => {
        setForm({
            id: source.id,
            name: source.name,
            type: (source.type as ReferralSourceType) || 'PERSON',
            phone: source.phone ?? '',
            active: source.active,
        })
        setDialogOpen(true)
    }

    const saveSource = async () => {
        if (!form.name.trim()) {
            return
        }
        setSaving(true)
        try {
            const payload: ReferralSourcePayload = {
                name: form.name.trim(),
                type: form.type,
                phone: form.phone || null,
                active: form.active,
            }
            if (form.id) {
                await apiUpdateReferralSource(form.id, payload)
            } else {
                await apiCreateReferralSource(payload)
            }
            setDialogOpen(false)
            await fetchSources()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(
                        error,
                        'Error al guardar la fuente',
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
            await apiDeleteReferralSource(toDelete.id)
            setToDelete(null)
            await fetchSources()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(
                        error,
                        'Error al eliminar la fuente',
                    )}
                </Notification>,
            )
        }
    }

    const columns: ColumnDef<ReferralSource>[] = useMemo(
        () => [
            {
                header: 'Nombre',
                accessorKey: 'name',
                cell: (props) => {
                    const source = props.row.original
                    return canWrite ? (
                        <button
                            type="button"
                            className={`font-semibold hover:underline ${textTheme}`}
                            onClick={() => openEdit(source)}
                        >
                            {source.name}
                        </button>
                    ) : (
                        <div className="font-semibold">{source.name}</div>
                    )
                },
            },
            {
                header: 'Tipo',
                accessorKey: 'type',
                cell: (props) => typeLabel(props.row.original.type),
            },
            {
                header: 'Teléfono',
                accessorKey: 'phone',
                cell: (props) => props.row.original.phone || '—',
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
                    const source = props.row.original
                    return (
                        <TableRowActions
                            editTitle="Editar"
                            deleteTitle="Eliminar"
                            onEdit={
                                canWrite ? () => openEdit(source) : undefined
                            }
                            onDelete={
                                canDelete
                                    ? () => setToDelete(source)
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
                title="Fuentes de referido"
                subtitle="Catálogo"
                info="Catálogo de personas y clínicas que refieren pacientes."
                chips={
                    sources.length > 0
                        ? [
                              `${sources.length} ítem${sources.length === 1 ? '' : 's'}`,
                          ]
                        : undefined
                }
                extra={
                    canWrite ? (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiPlusCircle />}
                            onClick={openCreate}
                        >
                            Nueva
                        </Button>
                    ) : undefined
                }
            />
            <AdaptableCard className="h-full" bodyClass="h-full p-0">
                {!loading && sources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="font-semibold mb-1">Sin fuentes</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Crea la primera fuente de referido.
                        </p>
                        {canWrite && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={openCreate}
                            >
                                Nueva fuente
                            </Button>
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={sources}
                        loading={loading}
                        pagingData={{
                            total: sources.length,
                            pageIndex: 1,
                            pageSize: sources.length || 10,
                        }}
                    />
                )}
            </AdaptableCard>

            <FormDrawer
                isOpen={dialogOpen}
                accent="rose"
                icon={<HiOutlineShare />}
                title={form.id ? 'Editar fuente' : 'Nueva fuente'}
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
                saveDisabled={!form.name.trim()}
                onClose={() => setDialogOpen(false)}
                onSave={saveSource}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">
                            Nombre
                        </div>
                        <Input
                            placeholder="Dr. Pérez / Clínica Centro"
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
                        <div className="mb-1.5 text-sm font-semibold">Tipo</div>
                        <Select
                            options={typeOptions}
                            value={typeOptions.filter(
                                (option) => option.value === form.type,
                            )}
                            onChange={(option) =>
                                setForm((prev) => ({
                                    ...prev,
                                    type:
                                        (option?.value as ReferralSourceType) ||
                                        'PERSON',
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1.5 text-sm font-semibold">
                            Teléfono
                        </div>
                        <Input
                            placeholder="2222-0000"
                            value={form.phone}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
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
                title="Eliminar fuente"
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
                    <span className="font-semibold">{toDelete?.name}</span>?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default ReferralSourceList
