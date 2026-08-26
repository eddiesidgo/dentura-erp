import { useEffect, useState } from 'react'
import Select from '@/components/ui/Select'
import { SUPER_ADMIN } from '@/constants/roles.constant'
import { apiGetClinics, apiSwitchClinic } from '@/services/ClinicService'
import {
    setClinicList,
    setCurrentClinic,
    setUser,
    signInSuccess,
    useAppDispatch,
    useAppSelector,
} from '@/store'
import { applyClinicTheme } from '@/utils/applyClinicTheme'
import useThemeClass from '@/utils/hooks/useThemeClass'
import type { ClinicIdentity } from '@/@types/clinic'

type ClinicOption = {
    label: string
    value: number
}

const ClinicSwitcher = () => {
    const dispatch = useAppDispatch()
    const authority = useAppSelector((state) => state.auth.user.authority) || []
    const current = useAppSelector((state) => state.clinic.current)
    const list = useAppSelector((state) => state.clinic.list)
    const [switching, setSwitching] = useState(false)
    const { pageTitleTheme } = useThemeClass()

    const isSuperAdmin = authority.includes(SUPER_ADMIN)

    useEffect(() => {
        if (!isSuperAdmin) {
            return
        }
        apiGetClinics()
            .then((response) => {
                dispatch(setClinicList(response.data))
            })
            .catch(() => {
                dispatch(setClinicList([]))
            })
    }, [dispatch, isSuperAdmin])

    if (!isSuperAdmin) {
        return current?.name ? (
            <div className={`hidden lg:block text-sm font-semibold px-2 ${pageTitleTheme}`}>
                {current.name}
            </div>
        ) : null
    }

    const options: ClinicOption[] = list.map((clinic) => ({
        label: clinic.name,
        value: clinic.id,
    }))

    const onSwitch = async (option: ClinicOption) => {
        if (!option || option.value === current?.id) {
            return
        }
        setSwitching(true)
        try {
            const response = await apiSwitchClinic(option.value)
            dispatch(signInSuccess(response.data.token))
            dispatch(setUser(response.data.user))
            dispatch(setCurrentClinic(response.data.clinic))
            applyClinicTheme(dispatch, response.data.clinic as ClinicIdentity)
            window.location.reload()
        } finally {
            setSwitching(false)
        }
    }

    return (
        <div className="min-w-[180px]">
            <Select<ClinicOption>
                size="sm"
                isDisabled={switching}
                placeholder="Clínica"
                options={options}
                value={options.filter((option) => option.value === current?.id)}
                onChange={(opt) => onSwitch(opt as ClinicOption)}
            />
        </div>
    )
}

export default ClinicSwitcher
