import ApiService from './ApiService'
import type { InventoryItem, InventoryMovement } from '@/@types/inventory'

export async function apiGetInventory() {
    return ApiService.fetchData<InventoryItem[]>({
        url: '/inventory',
        method: 'get',
    })
}

export async function apiCreateInventoryItem(data: {
    sku?: string | null
    name: string
    unit?: string
    quantity?: number
    minQuantity?: number
    active?: boolean
}) {
    return ApiService.fetchData<InventoryItem>({
        url: '/inventory',
        method: 'post',
        data,
    })
}

export async function apiUpdateInventoryItem(
    id: number,
    data: {
        sku?: string | null
        name: string
        unit?: string
        minQuantity?: number
        active?: boolean
    },
) {
    return ApiService.fetchData<InventoryItem>({
        url: `/inventory/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteInventoryItem(id: number) {
    return ApiService.fetchData<void>({
        url: `/inventory/${id}`,
        method: 'delete',
    })
}

export async function apiCreateInventoryMovement(data: {
    itemId: number
    type: 'IN' | 'OUT' | 'ADJUST'
    quantity: number
    note?: string | null
}) {
    return ApiService.fetchData<InventoryMovement>({
        url: '/inventory/movements',
        method: 'post',
        data,
    })
}
