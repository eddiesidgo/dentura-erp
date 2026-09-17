import { useState } from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import ActionLink from '@/components/shared/ActionLink'
import { apiForgotPassword } from '@/services/AuthService'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import type { CommonProps } from '@/@types/common'
import type { AxiosError } from 'axios'

interface ForgotPasswordFormProps extends CommonProps {
    disableSubmit?: boolean
    signInUrl?: string
}

type ForgotPasswordFormSchema = {
    email: string
}

type ForgotPasswordApiResponse = {
    success?: boolean
    resetPath?: string | null
}

const validationSchema = Yup.object().shape({
    email: Yup.string().required('Ingresa tu correo o usuario'),
})

const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {
    const { disableSubmit = false, className, signInUrl = '/sign-in' } = props

    const [emailSent, setEmailSent] = useState(false)
    const [resetPath, setResetPath] = useState<string | null>(null)

    const [message, setMessage] = useTimeOutMessage()

    const onSendMail = async (
        values: ForgotPasswordFormSchema,
        setSubmitting: (isSubmitting: boolean) => void,
    ) => {
        setSubmitting(true)
        try {
            const resp = await apiForgotPassword(values)
            const data = resp.data as ForgotPasswordApiResponse
            if (data) {
                setResetPath(data.resetPath || null)
                setEmailSent(true)
            }
            setSubmitting(false)
        } catch (errors) {
            setMessage(
                (errors as AxiosError<{ message: string }>)?.response?.data
                    ?.message || (errors as Error).toString(),
            )
            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <div className="mb-6">
                {emailSent ? (
                    <>
                        <h3 className="mb-1">Solicitud recibida</h3>
                        <p>
                            Si la cuenta existe, puedes restablecer la
                            contraseña con el enlace generado.
                        </p>
                        {resetPath ? (
                            <p className="mt-3 text-sm">
                                Enlace de restablecimiento:{' '}
                                <ActionLink to={resetPath}>
                                    {resetPath}
                                </ActionLink>
                            </p>
                        ) : null}
                    </>
                ) : (
                    <>
                        <h3 className="mb-1">Recuperar contraseña</h3>
                        <p>
                            Ingresa tu correo o usuario para generar un enlace
                            de restablecimiento.
                        </p>
                    </>
                )}
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    {message}
                </Alert>
            )}
            <Formik
                initialValues={{
                    email: '',
                }}
                validationSchema={validationSchema}
                onSubmit={(values, { setSubmitting }) => {
                    if (!disableSubmit) {
                        onSendMail(values, setSubmitting)
                    } else {
                        setSubmitting(false)
                    }
                }}
            >
                {({ touched, errors, isSubmitting }) => (
                    <Form>
                        <FormContainer>
                            <div className={emailSent ? 'hidden' : ''}>
                                <FormItem
                                    invalid={
                                        !!(errors.email && touched.email)
                                    }
                                    errorMessage={errors.email}
                                >
                                    <Field
                                        type="text"
                                        autoComplete="username"
                                        name="email"
                                        placeholder="Correo o usuario"
                                        component={Input}
                                    />
                                </FormItem>
                            </div>
                            <Button
                                block
                                loading={isSubmitting}
                                variant="solid"
                                type="submit"
                            >
                                {emailSent
                                    ? 'Solicitar de nuevo'
                                    : 'Continuar'}
                            </Button>
                            <div className="mt-4 text-center">
                                <span>Volver a </span>
                                <ActionLink to={signInUrl}>
                                    iniciar sesión
                                </ActionLink>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default ForgotPasswordForm
