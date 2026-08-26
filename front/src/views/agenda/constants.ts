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
