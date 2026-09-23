import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { SUPER_ADMIN } from '@/constants/roles.constant'
import { apiCreateClinic, apiGetClinics } from '@/services/ClinicService'
import { setClinicList, useAppDispatch, useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'
import type { ClinicDeliveryPreset } from '@/@types/clinic'

const presetOptions: { value: ClinicDeliveryPreset; label: string }[] = [
    { value: 'BASIC', label: 'Básica (1 doctor, sin salas ni referidos)' },
    { value: 'MULTI_DOCTOR', label: 'Multi-doctor (sin referidos)' },
    { value: 'FULL', label: 'Completa (agenda + referidos)' },
]

const CreateClinicFields = () => {
    const dispatch = useAppDispatch()
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [preset, setPreset] = useState<ClinicDeliveryPreset>('FULL')
    const [creating, setCreating] = useState(false)
    const { pageTitleTheme } = useThemeClass()

    if (!authority.includes(SUPER_ADMIN)) {
        return null
    }

    const onCreate = async () => {
        if (!code.trim() || !name.trim()) {
            return
        }
        setCreating(true)
        try {
            await apiCreateClinic({
                code: code.trim().toLowerCase(),
                name: name.trim(),
                preset,
            })
            setCode('')
            setName('')
            setPreset('FULL')
            const list = await apiGetClinics()
            dispatch(setClinicList(list.data))
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <h6 className={pageTitleTheme}>Nueva clínica</h6>
            <Input
                size="sm"
                placeholder="código (ej. norte)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
            />
            <Input
                size="sm"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Select
                size="sm"
                options={presetOptions}
                value={presetOptions.find((o) => o.value === preset)}
                onChange={(option) => {
                    if (option) {
                        setPreset(option.value as ClinicDeliveryPreset)
                    }
                }}
            />
            <Button size="sm" loading={creating} onClick={onCreate}>
                Crear clínica
            </Button>
        </div>
    )
}

export default CreateClinicFields
