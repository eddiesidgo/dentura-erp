import type { WorkStatus } from '@/@types/work'

export const workStatusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'COMPLETED', label: 'Terminado' },
    { value: 'REJECTED', label: 'No aceptado' },
]

export const workStatusLabel = (status: WorkStatus) =>
    workStatusOptions.find((option) => option.value === status)?.label || status

export const workStatusClass: Record<WorkStatus, string> = {
    PENDING:
        'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100 border-0',
    COMPLETED:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0',
    REJECTED:
        'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-0',
}

export const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
    }).format(value ?? 0)
