import Input from '@/components/ui/Input'
import { SUPER_ADMIN } from '@/constants/roles.constant'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'
import type { ClinicIdentity } from '@/@types/clinic'

const IdentityFields = () => {
    const dispatch = useAppDispatch()
    const clinic = useAppSelector((state) => state.clinic.current)
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const { pageTitleTheme } = useThemeClass()

    if (!authority.includes(SUPER_ADMIN) || !clinic) {
        return clinic?.name ? (
            <div>
                <h6 className={`mb-1 ${pageTitleTheme}`}>Clínica</h6>
                <span>{clinic.name}</span>
            </div>
        ) : null
    }

    const patch = (partial: Partial<ClinicIdentity>) => {
        dispatch(setCurrentClinic({ ...clinic, ...partial }))
    }

    return (
        <div className="flex flex-col gap-3">
            <h6 className={pageTitleTheme}>Identidad de clínica</h6>
            <Input
                size="sm"
                placeholder="Nombre"
                value={clinic.name}
                onChange={(e) => patch({ name: e.target.value })}
            />
            <Input
                size="sm"
                placeholder="NIT"
                value={clinic.nit || ''}
                onChange={(e) => patch({ nit: e.target.value })}
            />
            <Input
                size="sm"
                placeholder="Teléfono"
                value={clinic.phone || ''}
                onChange={(e) => patch({ phone: e.target.value })}
            />
            <Input
                size="sm"
                placeholder="Email"
                value={clinic.email || ''}
                onChange={(e) => patch({ email: e.target.value })}
            />
            <Input
                size="sm"
                placeholder="Dirección"
                value={clinic.address || ''}
                onChange={(e) => patch({ address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
                <Input
                    size="sm"
                    placeholder="Ciudad"
                    value={clinic.city || ''}
                    onChange={(e) => patch({ city: e.target.value })}
                />
                <Input
                    size="sm"
                    placeholder="Departamento"
                    value={clinic.department || ''}
                    onChange={(e) => patch({ department: e.target.value })}
                />
            </div>
            <Input
                size="sm"
                placeholder="URL del logo"
                value={clinic.logoUrl || ''}
                onChange={(e) => patch({ logoUrl: e.target.value })}
            />
        </div>
    )
}

export default IdentityFields
