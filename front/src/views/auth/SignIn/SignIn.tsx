import SignInForm from './SignInForm'
import { useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'

const SignIn = () => {
    const clinicName = useAppSelector((state) => state.clinic.current?.name) || 'Dentura'
    const { pageTitleTheme } = useThemeClass()

    return (
        <>
            <div className="mb-8">
                <h3 className={`mb-1 ${pageTitleTheme}`}>Bienvenido a {clinicName}</h3>
                <p>Ingresa tus credenciales para continuar</p>
            </div>
            <SignInForm disableSubmit={false} />
        </>
    )
}

export default SignIn
