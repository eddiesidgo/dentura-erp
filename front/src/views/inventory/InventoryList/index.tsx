import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import PageHeader from '@/components/shared/PageHeader'
import {
    Button,
    Input,
    Notification,
    Select,
    Tag,
    toast,
} from '@/components/ui'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import { CATALOG_DELETE, CATALOG_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiCreateInventoryItem,
    apiCreateInventoryMovement,
    apiDeleteInventoryItem,
    apiGetInventory,
} from '@/services/InventoryService'
import type { InventoryItem } from '@/@types/inventory'

const movementOptions = [
    { value: 'IN', label: 'Entrada' },
    { value: 'OUT', label: 'Salida' },
    { value: 'ADJUST', label: 'Ajuste (set)' },
]

const InventoryList = () => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [CATALOG_WRITE])
    const canDelete = useAuthority(userAuthority, [CATALOG_DELETE])
    const [items, setItems] = useState<InventoryItem[]>([])
    const [name, setName] = useState('')
    const [sku, setSku] = useState('')
    const [quantity, setQuantity] = useState('0')
    const [moveItemId, setMoveItemId] = useState<number | undefined>()
    const [moveType, setMoveType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN')
    const [moveQty, setMoveQty] = useState('1')
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        try {
            const { data } = await apiGetInventory()
            setItems(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error inventario')}
                </Notification>,
            )
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const createItem = async () => {
        if (!name.trim()) {
            return
        }
        setSaving(true)
        try {
            await apiCreateInventoryItem({
                name: name.trim(),
                sku: sku || null,
                quantity: Number(quantity) || 0,
            })
            setName('')
            setSku('')
            setQuantity('0')
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo crear">
                    {getApiErrorMessage(error, 'Error')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const move = async () => {
        if (!moveItemId || !Number(moveQty)) {
            return
        }
        setSaving(true)
        try {
            await apiCreateInventoryMovement({
                itemId: moveItemId,
                type: moveType,
                quantity: Number(moveQty),
            })
            setMoveQty('1')
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo mover stock">
                    {getApiErrorMessage(error, 'Error')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const remove = async (id: number) => {
        try {
            await apiDeleteInventoryItem(id)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error')}
                </Notification>,
            )
        }
    }

    const itemOptions = items.map((item) => ({
        value: item.id,
        label: item.name,
    }))

    return (
        <>
            <PageHeader
                title="Inventario"
                subtitle="Clínica"
                info="Ítems y movimientos simples de stock (entradas, salidas y ajustes)."
                chips={[`${items.length} ítem${items.length === 1 ? '' : 's'}`]}
            />
            <AdaptableCard className="mb-4">
                <AuthorityCheck
                    authority={[CATALOG_WRITE]}
                    userAuthority={userAuthority}
                >
                    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <Input
                            placeholder="Nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            placeholder="SKU"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                        <Input
                            placeholder="Cantidad inicial"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                        <Button
                            variant="solid"
                            loading={saving}
                            onClick={createItem}
                        >
                            Agregar ítem
                        </Button>
                    </div>
                    <div className="mb-2 text-sm font-semibold">Movimiento</div>
                    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <Select
                            options={itemOptions}
                            value={itemOptions.filter(
                                (option) => option.value === moveItemId,
                            )}
                            onChange={(option) => setMoveItemId(option?.value)}
                        />
                        <Select
                            options={movementOptions}
                            value={movementOptions.filter(
                                (option) => option.value === moveType,
                            )}
                            onChange={(option) =>
                                setMoveType(
                                    (option?.value as 'IN' | 'OUT' | 'ADJUST') ||
                                        'IN',
                                )
                            }
                        />
                        <Input
                            placeholder="Cantidad"
                            value={moveQty}
                            onChange={(e) => setMoveQty(e.target.value)}
                        />
                        <Button loading={saving} onClick={move}>
                            Registrar
                        </Button>
                    </div>
                </AuthorityCheck>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-slate-500">
                                <th className="px-2 py-2">Nombre</th>
                                <th className="px-2 py-2">SKU</th>
                                <th className="px-2 py-2">Stock</th>
                                <th className="px-2 py-2">Mín.</th>
                                <th className="px-2 py-2">Estado</th>
                                <th className="px-2 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-slate-100 dark:border-slate-800"
                                >
                                    <td className="px-2 py-2 font-semibold">
                                        {item.name}
                                    </td>
                                    <td className="px-2 py-2">
                                        {item.sku || '—'}
                                    </td>
                                    <td className="px-2 py-2 tabular-nums">
                                        {item.quantity} {item.unit}
                                    </td>
                                    <td className="px-2 py-2 tabular-nums">
                                        {item.minQuantity}
                                    </td>
                                    <td className="px-2 py-2">
                                        {item.lowStock ? (
                                            <Tag className="bg-amber-100 text-amber-700">
                                                Bajo
                                            </Tag>
                                        ) : (
                                            <Tag className="bg-emerald-100 text-emerald-700">
                                                OK
                                            </Tag>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        {canDelete ? (
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                className="text-red-500"
                                                onClick={() => remove(item.id)}
                                            >
                                                Eliminar
                                            </Button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-2 py-8 text-center text-slate-500"
                                    >
                                        Sin ítems. {canWrite ? 'Agregá el primero.' : ''}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>
        </>
    )
}

export default InventoryList
