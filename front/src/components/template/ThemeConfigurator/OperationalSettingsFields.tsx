import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import { SUPER_ADMIN, CLINIC_MANAGE } from '@/constants/roles.constant'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'
import useAuthority from '@/utils/hooks/useAuthority'
import {
    DEFAULT_CLINIC_FEATURES,
    type ClinicProviderMode,
    type ClinicRoomMode,
} from '@/@types/clinic'

const providerOptions = [
    { value: 'SINGLE', label: 'Un solo profesional' },
    { value: 'MULTI', label: 'Múltiples profesionales' },
]

const roomOptions = [
    { value: 'OFF', label: 'Sin consultorios' },
    { value: 'OPTIONAL', label: 'Consultorios opcionales' },
    { value: 'REQUIRED', label: 'Consultorio obligatorio' },
]

const OperationalSettingsFields = () => {
    const dispatch = useAppDispatch()
    const clinic = useAppSelector((state) => state.clinic.current)
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const canManage = useAuthority(authority, [SUPER_ADMIN, CLINIC_MANAGE])
    const { pageTitleTheme } = useThemeClass()

    if (!canManage || !clinic) {
        return null
    }

    const features = clinic.features ?? DEFAULT_CLINIC_FEATURES

    const patchFeatures = (partial: Partial<typeof features>) => {
        dispatch(
            setCurrentClinic({
                ...clinic,
                features: { ...features, ...partial },
            }),
        )
    }

    const patchReminder = (
        partial: Partial<
            Pick<
                typeof clinic,
                | 'reminderHoursBefore'
                | 'reminderMessageTemplate'
                | 'reminderDefaultCountryCode'
            >
        >,
    ) => {
        dispatch(setCurrentClinic({ ...clinic, ...partial }))
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h6 className={pageTitleTheme}>Operación de clínica</h6>
                <span className="text-xs text-gray-500">
                    Perfil de agenda y módulos activos para esta instalación
                </span>
            </div>
            <div>
                <div className="mb-1 text-sm font-semibold">Profesionales</div>
                <Select
                    size="sm"
                    options={providerOptions}
                    value={providerOptions.find(
                        (o) => o.value === features.providerMode,
                    )}
                    onChange={(option) => {
                        if (option) {
                            patchFeatures({
                                providerMode: option.value as ClinicProviderMode,
                            })
                        }
                    }}
                />
            </div>
            <div>
                <div className="mb-1 text-sm font-semibold">Consultorios</div>
                <Select
                    size="sm"
                    options={roomOptions}
                    value={roomOptions.find((o) => o.value === features.roomMode)}
                    onChange={(option) => {
                        if (option) {
                            patchFeatures({
                                roomMode: option.value as ClinicRoomMode,
                            })
                        }
                    }}
                />
            </div>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">Referidos de entrada</div>
                    <span className="text-xs text-gray-500">
                        Fuentes y campo en ficha del paciente
                    </span>
                </div>
                <Switcher
                    checked={features.referralsInboundEnabled}
                    onChange={(checked) =>
                        patchFeatures({ referralsInboundEnabled: checked })
                    }
                />
            </div>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">Referidos de salida</div>
                    <span className="text-xs text-gray-500">
                        Envío a especialistas desde el paciente
                    </span>
                </div>
                <Switcher
                    checked={features.referralsOutboundEnabled}
                    onChange={(checked) =>
                        patchFeatures({ referralsOutboundEnabled: checked })
                    }
                />
            </div>
            <div>
                <h6 className={`mb-2 ${pageTitleTheme}`}>Recordatorios</h6>
                <div className="flex flex-col gap-3">
                    <Input
                        size="sm"
                        type="number"
                        min={1}
                        max={168}
                        placeholder="Horas antes"
                        value={clinic.reminderHoursBefore ?? 24}
                        onChange={(e) =>
                            patchReminder({
                                reminderHoursBefore: Number(e.target.value) || 24,
                            })
                        }
                    />
                    <Input
                        size="sm"
                        placeholder="Código país (ej. 503)"
                        value={clinic.reminderDefaultCountryCode || ''}
                        onChange={(e) =>
                            patchReminder({
                                reminderDefaultCountryCode: e.target.value,
                            })
                        }
                    />
                    <Input
                        textArea
                        size="sm"
                        rows={3}
                        placeholder="Plantilla del mensaje"
                        value={clinic.reminderMessageTemplate || ''}
                        onChange={(e) =>
                            patchReminder({
                                reminderMessageTemplate: e.target.value,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    )
}

export default OperationalSettingsFields
