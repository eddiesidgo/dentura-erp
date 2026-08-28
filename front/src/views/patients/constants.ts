import dayjs from 'dayjs'

export const sexOptions = [
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'MALE', label: 'Masculino' },
    { value: 'OTHER', label: 'Otro' },
]

export const departmentOptions = [
    { value: 'Ahuachapán', label: 'Ahuachapán' },
    { value: 'Cabañas', label: 'Cabañas' },
    { value: 'Chalatenango', label: 'Chalatenango' },
    { value: 'Cuscatlán', label: 'Cuscatlán' },
    { value: 'La Libertad', label: 'La Libertad' },
    { value: 'La Paz', label: 'La Paz' },
    { value: 'La Unión', label: 'La Unión' },
    { value: 'Morazán', label: 'Morazán' },
    { value: 'San Miguel', label: 'San Miguel' },
    { value: 'San Salvador', label: 'San Salvador' },
    { value: 'San Vicente', label: 'San Vicente' },
    { value: 'Santa Ana', label: 'Santa Ana' },
    { value: 'Sonsonate', label: 'Sonsonate' },
    { value: 'Usulután', label: 'Usulután' },
]

export const sexLabel = (sex?: string | null) =>
    sexOptions.find((option) => option.value === sex)?.label || '—'

export const sexTagClass: Record<string, string> = {
    FEMALE:
        'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-100 border-0',
    MALE: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100 border-0',
    OTHER: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-100 border-0',
}

export const patientInitials = (firstName?: string, lastName?: string) => {
    const a = (firstName || '').trim().charAt(0)
    const b = (lastName || '').trim().charAt(0)
    return `${a}${b}`.toUpperCase() || '?'
}

export const patientAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) {
        return null
    }
    const dob = dayjs(dateOfBirth)
    if (!dob.isValid()) {
        return null
    }
    const age = dayjs().diff(dob, 'year')
    return age >= 0 ? age : null
}

export const patientLocation = (
    city?: string | null,
    department?: string | null,
) => {
    const parts = [city, department].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
}
