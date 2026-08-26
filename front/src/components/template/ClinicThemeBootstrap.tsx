import { useEffect } from 'react'
import { apiGetCurrentClinic, apiGetPublicClinicIdentity } from '@/services/ClinicService'
import { setCurrentClinic, useAppDispatch, useAppSelector } from '@/store'
import { applyClinicTheme } from '@/utils/applyClinicTheme'

const ClinicThemeBootstrap = () => {
    const dispatch = useAppDispatch()
    const signedIn = useAppSelector((state) => state.auth.session.signedIn)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const response = signedIn
                    ? await apiGetCurrentClinic()
                    : await apiGetPublicClinicIdentity()
                if (cancelled || !response.data) {
                    return
                }
                dispatch(setCurrentClinic(response.data))
                applyClinicTheme(dispatch, response.data)
            } catch {
                // Keep compiled defaults until the API is available.
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [dispatch, signedIn])

    return null
}

export default ClinicThemeBootstrap
