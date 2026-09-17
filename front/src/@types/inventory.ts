export type InventoryItem = {
    id: number
    clinicId: number
    sku: string | null
    name: string
    unit: string
    quantity: number
    minQuantity: number
    active: boolean
    lowStock: boolean
}

export type InventoryMovement = {
    id: number
    clinicId: number
    itemId: number
    type: 'IN' | 'OUT' | 'ADJUST'
    quantity: number
    note: string | null
    createdAt: string
}
