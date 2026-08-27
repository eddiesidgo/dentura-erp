import type { AppointmentStatus } from '@/@types/appointment'

export const statusOptions = [
    { value: 'SCHEDULED', label: 'Programada' },
    { value: 'CONFIRMED', label: 'Confirmada' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'NO_SHOW', label: 'No asistió' },
]

export const statusColor: Record<AppointmentStatus, string> = {
    SCHEDULED: 'blue',
    CONFIRMED: 'emerald',
    COMPLETED: 'green',
    CANCELLED: 'red',
    NO_SHOW: 'amber',
}

export const statusTagClass: Record<AppointmentStatus, string> = {
    SCHEDULED:
        'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100 border-0',
    CONFIRMED:
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-0',
    COMPLETED:
        'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100 border-0',
    CANCELLED:
        'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-0',
    NO_SHOW:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100 border-0',
}
