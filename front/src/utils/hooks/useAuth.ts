import { apiSignIn, apiSignOut, apiSignUp } from '@/services/AuthService'
import {
    setCurrentClinic,
    setUser,
    signInSuccess,
    signOutSuccess,
    useAppSelector,
    useAppDispatch,
} from '@/store'
import { applyClinicTheme } from '@/utils/applyClinicTheme'
import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router-dom'
import useQuery from './useQuery'
import type { SignInCredential, SignInResponse, SignUpCredential } from '@/@types/auth'

type Status = 'success' | 'failed'

function useAuth() {
    const dispatch = useAppDispatch()

    const navigate = useNavigate()

    const query = useQuery()

    const { token, signedIn } = useAppSelector((state) => state.auth.session)

    const applySession = (respData: SignInResponse) => {
        dispatch(signInSuccess(respData.token))
        if (respData.user) {
            dispatch(setUser(respData.user))
        }
        if (respData.clinic) {
            dispatch(setCurrentClinic(respData.clinic))
            applyClinicTheme(dispatch, respData.clinic)
        }
        const redirectUrl = query.get(REDIRECT_URL_KEY)
        navigate(redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath)
    }

    const signIn = async (
        values: SignInCredential,
    ): Promise<
        | {
              status: Status
              message: string
          }
        | undefined
    > => {
        try {
            const resp = await apiSignIn(values)
            if (resp.data) {
                applySession(resp.data)
                return {
                    status: 'success',
                    message: '',
                }
            }
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const signUp = async (values: SignUpCredential) => {
        try {
            const resp = await apiSignUp(values)
            if (resp.data) {
                applySession(resp.data)
                return {
                    status: 'success',
                    message: '',
                }
            }
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const handleSignOut = () => {
        dispatch(signOutSuccess())
        dispatch(
            setUser({
                avatar: '',
                userName: '',
                email: '',
                authority: [],
                clinicId: null,
            }),
        )
        dispatch(setCurrentClinic(null))
        navigate(appConfig.unAuthenticatedEntryPath)
    }

    const signOut = async () => {
        await apiSignOut()
        handleSignOut()
    }

    return {
        authenticated: token && signedIn,
        signIn,
        signUp,
        signOut,
    }
}

export default useAuth
