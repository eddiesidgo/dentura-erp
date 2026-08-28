import { useState } from 'react'
import Input from '@/components/ui/Input'
import Upload from '@/components/ui/Upload'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { SUPER_ADMIN } from '@/constants/roles.constant'
import { apiUploadClinicLogo } from '@/services/ClinicService'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'
import type { ClinicIdentity } from '@/@types/clinic'

const IdentityFields = () => {
    const dispatch = useAppDispatch()
    const clinic = useAppSelector((state) => state.clinic.current)
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const { pageTitleTheme } = useThemeClass()
    const [uploadingLogo, setUploadingLogo] = useState(false)

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

    const handleLogoUpload = async (files: File[]) => {
        const file = files[0]
        if (!file) {
            return
        }
        setUploadingLogo(true)
        try {
            const response = await apiUploadClinicLogo(file)
            dispatch(setCurrentClinic(response.data))
            toast.push(
                <Notification title="Logo actualizado" type="success">
                    El logo aparecerá en la app y en los PDF.
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error: any) {
            toast.push(
                <Notification title="No se pudo subir el logo" type="danger">
                    {error?.response?.data?.message || 'Intenta con PNG, JPG o WEBP'}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setUploadingLogo(false)
        }
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
            <div>
                <div className="mb-2 text-sm font-semibold">Logo de la clínica</div>
                {clinic.logoUrl ? (
                    <img
                        src={clinic.logoUrl}
                        alt={`Logo ${clinic.name}`}
                        className="mb-3 h-14 max-w-[180px] object-contain rounded border border-gray-200 dark:border-gray-600 p-1 bg-white"
                    />
                ) : (
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        Sin logo. Los PDF usarán las iniciales de la clínica.
                    </p>
                )}
                <Upload
                    draggable
                    disabled={uploadingLogo}
                    accept="image/png,image/jpeg,image/webp"
                    showList={false}
                    onChange={handleLogoUpload}
                >
                    <span className="text-sm">
                        {uploadingLogo
                            ? 'Subiendo...'
                            : 'Arrastra una imagen o haz clic'}
                    </span>
                </Upload>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG o WEBP · máx. 2 MB
                </p>
            </div>
        </div>
    )
}

export default IdentityFields
