import { useState } from 'react'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { SUPER_ADMIN, CLINIC_MANAGE } from '@/constants/roles.constant'
import { apiUpdateCurrentClinic } from '@/services/ClinicService'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import { applyClinicTheme } from '@/utils/applyClinicTheme'
import useAuthority from '@/utils/hooks/useAuthority'

const SaveIdentityButton = () => {
    const dispatch = useAppDispatch()
    const theme = useAppSelector((state) => state.theme)
    const clinic = useAppSelector((state) => state.clinic.current)
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const canManage = useAuthority(authority, [SUPER_ADMIN, CLINIC_MANAGE])
    const [saving, setSaving] = useState(false)

    if (!canManage || !clinic) {
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
                providerMode: clinic.features?.providerMode,
                roomMode: clinic.features?.roomMode,
                referralsInboundEnabled: clinic.features?.referralsInboundEnabled,
                referralsOutboundEnabled:
                    clinic.features?.referralsOutboundEnabled,
                reminderHoursBefore: clinic.reminderHoursBefore,
                reminderMessageTemplate: clinic.reminderMessageTemplate,
                reminderDefaultCountryCode: clinic.reminderDefaultCountryCode,
            })
            dispatch(setCurrentClinic(response.data))
            applyClinicTheme(dispatch, response.data)
            toast.push(
                <Notification title="Configuración guardada" type="success">
                    Identidad, operación y recordatorios quedaron guardados.
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
            Guardar configuración de clínica
        </Button>
    )
}

export default SaveIdentityButton
