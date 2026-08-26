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
