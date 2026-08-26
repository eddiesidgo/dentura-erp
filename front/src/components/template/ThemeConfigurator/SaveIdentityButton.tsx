import { useState } from 'react'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { SUPER_ADMIN } from '@/constants/roles.constant'
import { apiUpdateCurrentClinic } from '@/services/ClinicService'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import { applyClinicTheme } from '@/utils/applyClinicTheme'

const SaveIdentityButton = () => {
    const dispatch = useAppDispatch()
    const theme = useAppSelector((state) => state.theme)
    const clinic = useAppSelector((state) => state.clinic.current)
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const [saving, setSaving] = useState(false)

    if (!authority.includes(SUPER_ADMIN) || !clinic) {
        return null
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await apiUpdateCurrentClinic({
                name: clinic.name,
                logoUrl: clinic.logoUrl,
                phone: clinic.phone,
                email: clinic.email,
                address: clinic.address,
                city: clinic.city,
                department: clinic.department,
                nit: clinic.nit,
                themeMode: theme.mode,
                themeColor: theme.themeColor,
                primaryColorLevel: theme.primaryColorLevel,
                navMode: theme.navMode,
                layoutType: theme.layout.type,
                direction: theme.direction,
            })
            dispatch(setCurrentClinic(response.data))
            applyClinicTheme(dispatch, response.data)
            toast.push(
                <Notification title="Identidad guardada" type="success">
                    El theme y la marca de esta clínica quedaron en la base de datos.
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error: any) {
            toast.push(
                <Notification title="No se pudo guardar" type="danger">
                    {error?.response?.data?.message || 'Intenta de nuevo'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <Button block loading={saving} variant="solid" onClick={handleSave}>
            Guardar identidad de clínica
        </Button>
    )
}

export default SaveIdentityButton
