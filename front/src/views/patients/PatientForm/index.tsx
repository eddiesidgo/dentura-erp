import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import dayjs from 'dayjs'
import {
    HiOutlineCash,
    HiOutlineClipboardList,
    HiOutlineCube,
    HiOutlineDocumentText,
    HiOutlineHeart,
    HiOutlinePhone,
    HiOutlinePhotograph,
    HiOutlineShare,
    HiOutlineUser,
} from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import Loading from '@/components/shared/Loading'
import StickyFooter from '@/components/shared/StickyFooter'
import {
    Button,
    DatePicker,
    FormContainer,
    FormItem,
    Input,
    Notification,
    Select,
    Tabs,
    toast,
} from '@/components/ui'
import {
    apiCreatePatient,
    apiGetPatient,
    apiUpdatePatient,
    getApiErrorMessage,
} from '@/services/PatientService'
import { apiGetReferralSources } from '@/services/ReferralService'
import { departmentOptions, sexOptions } from '../constants'
import type { PatientPayload } from '@/@types/patient'
import type { ReferralSource } from '@/@types/referral'
import PatientFormSection from './PatientFormSection'
import PatientFormStepper from './PatientFormStepper'
import PatientProfileHeader from './PatientProfileHeader'
import PatientWorks from './PatientWorks'
import PatientOdontogram from './PatientOdontogram'
import PatientPeriodontogram from './PatientPeriodontogram'
import PatientConsents from './PatientConsents'
import PatientPhotos from './PatientPhotos'
import PatientScans from './smile/PatientScans'
import PatientPrescriptions from './PatientPrescriptions'
import PatientPayments from './PatientPayments'
import PatientLedger from './PatientLedger'
import PatientReferrals from './PatientReferrals'
import {
    ODONTOGRAM_READ,
    PATIENTS_READ,
    PATIENTS_WRITE,
    PAYMENTS_READ,
    PHOTOS_READ,
    PRESCRIPTIONS_READ,
    REFERRALS_READ,
    SCANS_READ,
    SMILE_DESIGN_READ,
    WORKS_READ,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'

type FormModel = {
    recordNumber: string
    firstName: string
    lastName: string
    sex: string
    dateOfBirth: string
    phone: string
    mobile: string
    email: string
    address: string
    city: string
    department: string
    dui: string
    nit: string
    occupation: string
    referredBy: string
    referralSourceId: number | null
    allergies: string
    notes: string
}

const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('El nombre es obligatorio'),
    lastName: Yup.string().required('El apellido es obligatorio'),
    email: Yup.string().email('Correo inválido'),
})

const FORM_STEPS = [
    {
        id: 'personal',
        title: 'Datos personales',
        description: 'Identificación y datos básicos',
    },
    {
        id: 'contact',
        title: 'Contacto',
        description: 'Teléfonos, correo y domicilio',
    },
    {
        id: 'clinical',
        title: 'Fiscal y notas',
        description: 'Documentos y observaciones clínicas',
    },
] as const

const emptyValues: FormModel = {
    recordNumber: '',
    firstName: '',
    lastName: '',
    sex: '',
    dateOfBirth: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    department: '',
    dui: '',
    nit: '',
    occupation: '',
    referredBy: '',
    referralSourceId: null,
    allergies: '',
    notes: '',
}

const toPayload = (values: FormModel): PatientPayload => ({
    recordNumber: values.recordNumber || undefined,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    sex: values.sex || null,
    dateOfBirth: values.dateOfBirth || null,
    phone: values.phone || null,
    mobile: values.mobile || null,
    email: values.email || null,
    address: values.address || null,
    city: values.city || null,
    department: values.department || null,
    dui: values.dui || null,
    nit: values.nit || null,
    occupation: values.occupation || null,
    referredBy: values.referredBy || null,
    referralSourceId: values.referralSourceId,
    allergies: values.allergies || null,
    notes: values.notes || null,
})

const PatientForm = () => {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const isEdit = Boolean(patientId)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canReadWorks = useAuthority(userAuthority, [WORKS_READ])
    const canWritePatient = useAuthority(userAuthority, [PATIENTS_WRITE])
    const canReadOdontogram = useAuthority(userAuthority, [ODONTOGRAM_READ])
    const canReadPhotos = useAuthority(userAuthority, [PHOTOS_READ])
    const canReadScans = useAuthority(userAuthority, [
        SCANS_READ,
        SMILE_DESIGN_READ,
    ])
    const canReadPrescriptions = useAuthority(userAuthority, [
        PRESCRIPTIONS_READ,
    ])
    const canReadPayments = useAuthority(userAuthority, [PAYMENTS_READ])
    const canReadReferrals = useAuthority(userAuthority, [REFERRALS_READ])
    const canReadConsents = useAuthority(userAuthority, [PATIENTS_READ])
    const showChartTabs =
        isEdit &&
        (canReadWorks ||
            canReadOdontogram ||
            canReadPhotos ||
            canReadScans ||
            canReadPrescriptions ||
            canReadPayments ||
            canReadReferrals ||
            canReadConsents)
    const [loading, setLoading] = useState(isEdit)
    const [initialValues, setInitialValues] = useState<FormModel>(emptyValues)

    useEffect(() => {
        if (!patientId) {
            return
        }
        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                const { data } = await apiGetPatient(patientId)
                if (cancelled) {
                    return
                }
                setInitialValues({
                    recordNumber: data.recordNumber ?? '',
                    firstName: data.firstName ?? '',
                    lastName: data.lastName ?? '',
                    sex: data.sex ?? '',
                    dateOfBirth: data.dateOfBirth ?? '',
                    phone: data.phone ?? '',
                    mobile: data.mobile ?? '',
                    email: data.email ?? '',
                    address: data.address ?? '',
                    city: data.city ?? '',
                    department: data.department ?? '',
                    dui: data.dui ?? '',
                    nit: data.nit ?? '',
                    occupation: data.occupation ?? '',
                    referredBy: data.referredBy ?? '',
                    referralSourceId: data.referralSourceId ?? null,
                    allergies: data.allergies ?? '',
                    notes: data.notes ?? '',
                })
            } catch (error) {
                toast.push(
                    <Notification type="danger" title="No se pudo abrir la ficha">
                        {getApiErrorMessage(error, 'Paciente no encontrado')}
                    </Notification>,
                )
                navigate('/pacientes')
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [patientId, navigate])

    return (
        <Loading loading={loading}>
            {showChartTabs ? (
                <Tabs defaultValue="datos" variant="pill">
                    <div className="sticky top-0 z-20 mb-4 -mx-1 px-1 py-1 backdrop-blur-sm bg-gray-100/90 dark:bg-gray-900/90">
                        <AdaptableCard bodyClass="p-3">
                            <Tabs.TabList className="flex-wrap">
                                <Tabs.TabNav value="datos" icon={<HiOutlineUser />}>
                                    Datos del paciente
                                </Tabs.TabNav>
                                {canReadWorks && (
                                    <Tabs.TabNav
                                        value="trabajos"
                                        icon={<HiOutlineClipboardList />}
                                    >
                                        Plan de tratamiento
                                    </Tabs.TabNav>
                                )}
                                {canReadOdontogram && (
                                    <Tabs.TabNav
                                        value="odontograma"
                                        icon={<HiOutlineHeart />}
                                    >
                                        Odontograma
                                    </Tabs.TabNav>
                                )}
                                {canReadOdontogram && (
                                    <Tabs.TabNav
                                        value="periodontograma"
                                        icon={<HiOutlineHeart />}
                                    >
                                        Periodontograma
                                    </Tabs.TabNav>
                                )}
                                {canReadPhotos && (
                                    <Tabs.TabNav
                                        value="fotos"
                                        icon={<HiOutlinePhotograph />}
                                    >
                                        Fotos
                                    </Tabs.TabNav>
                                )}
                                {canReadScans && (
                                    <Tabs.TabNav
                                        value="scans"
                                        icon={<HiOutlineCube />}
                                    >
                                        Diseño 3D
                                    </Tabs.TabNav>
                                )}
                                {canReadPrescriptions && (
                                    <Tabs.TabNav
                                        value="recetas"
                                        icon={<HiOutlineDocumentText />}
                                    >
                                        Recetas
                                    </Tabs.TabNav>
                                )}
                                {canReadPayments && (
                                    <Tabs.TabNav
                                        value="pagos"
                                        icon={<HiOutlineCash />}
                                    >
                                        Pagos
                                    </Tabs.TabNav>
                                )}
                                {canReadReferrals && (
                                    <Tabs.TabNav
                                        value="referidos"
                                        icon={<HiOutlineShare />}
                                    >
                                        Referidos
                                    </Tabs.TabNav>
                                )}
                                {canReadConsents && (
                                    <Tabs.TabNav
                                        value="consentimientos"
                                        icon={<HiOutlineDocumentText />}
                                    >
                                        Consentimientos
                                    </Tabs.TabNav>
                                )}
                            </Tabs.TabList>
                        </AdaptableCard>
                    </div>
                    <Tabs.TabContent value="datos">
                        <PatientDataForm
                            isEdit
                            initialValues={initialValues}
                            showProfile
                            showBack
                        />
                    </Tabs.TabContent>
                    {canReadWorks && (
                        <Tabs.TabContent value="trabajos">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientWorks patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadOdontogram && (
                        <Tabs.TabContent value="odontograma">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientOdontogram patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadOdontogram && (
                        <Tabs.TabContent value="periodontograma">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientPeriodontogram
                                patientId={Number(patientId)}
                            />
                        </Tabs.TabContent>
                    )}
                    {canReadPhotos && (
                        <Tabs.TabContent value="fotos">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientPhotos patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadScans && (
                        <Tabs.TabContent value="scans">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientScans patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadPrescriptions && (
                        <Tabs.TabContent value="recetas">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientPrescriptions
                                patientId={Number(patientId)}
                            />
                        </Tabs.TabContent>
                    )}
                    {canReadPayments && (
                        <Tabs.TabContent value="pagos">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientPayments patientId={Number(patientId)} />
                            <PatientLedger patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadReferrals && (
                        <Tabs.TabContent value="referidos">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientReferrals patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                    {canReadConsents && (
                        <Tabs.TabContent value="consentimientos">
                            <PatientProfileHeader
                                values={initialValues}
                                showBack={false}
                            />
                            <PatientConsents patientId={Number(patientId)} />
                        </Tabs.TabContent>
                    )}
                </Tabs>
            ) : (
                <PatientDataForm
                    showProfile
                    showBack
                    isEdit={isEdit}
                    initialValues={initialValues}
                />
            )}
        </Loading>
    )
}

const PatientDataForm = ({
    isEdit,
    initialValues,
    showProfile,
    showBack = false,
}: {
    isEdit: boolean
    initialValues: FormModel
    showProfile: boolean
    showBack?: boolean
}) => {
    const navigate = useNavigate()
    const { patientId } = useParams()
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canReadReferrals = useAuthority(userAuthority, [REFERRALS_READ])
    const canWritePatient = useAuthority(userAuthority, [PATIENTS_WRITE])
    const [referralSources, setReferralSources] = useState<ReferralSource[]>([])
    const [step, setStep] = useState(0)

    useEffect(() => {
        if (!canReadReferrals) {
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const { data } = await apiGetReferralSources()
                if (!cancelled) {
                    setReferralSources(data.filter((source) => source.active))
                }
            } catch {
                if (!cancelled) {
                    setReferralSources([])
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [canReadReferrals])

    const referralSourceOptions = referralSources.map((source) => ({
        value: source.id,
        label: `${source.name}${source.type ? ` · ${source.type}` : ''}`,
    }))

    const isLastStep = step === FORM_STEPS.length - 1

    return (
        <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
                if (!canWritePatient) {
                    setSubmitting(false)
                    return
                }
                try {
                    const payload = toPayload(values)
                    if (isEdit && patientId) {
                        await apiUpdatePatient(patientId, payload)
                        toast.push(
                            <Notification type="success" title="Ficha actualizada">
                                Los datos del paciente se guardaron correctamente.
                            </Notification>,
                        )
                    } else {
                        const created = await apiCreatePatient(payload)
                        toast.push(
                            <Notification type="success" title="Paciente creado">
                                Expediente {created.data.recordNumber}
                            </Notification>,
                        )
                    }
                    navigate('/pacientes')
                } catch (error) {
                    toast.push(
                        <Notification type="danger" title="No se pudo guardar">
                            {getApiErrorMessage(
                                error,
                                'Revisa los datos e inténtalo de nuevo',
                            )}
                        </Notification>,
                    )
                } finally {
                    setSubmitting(false)
                }
            }}
        >
            {({
                values,
                touched,
                errors,
                isSubmitting,
                setFieldValue,
                setFieldTouched,
                validateForm,
                submitForm,
            }) => {
                const goNext = async () => {
                    if (step === 0) {
                        await setFieldTouched('firstName', true)
                        await setFieldTouched('lastName', true)
                        const nextErrors = await validateForm()
                        if (nextErrors.firstName || nextErrors.lastName) {
                            toast.push(
                                <Notification
                                    type="warning"
                                    title="Completa los datos obligatorios"
                                >
                                    Nombre y apellido son necesarios para
                                    continuar.
                                </Notification>,
                            )
                            return
                        }
                    }
                    setStep((current) =>
                        Math.min(current + 1, FORM_STEPS.length - 1),
                    )
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }

                const goBack = () => {
                    setStep((current) => Math.max(current - 1, 0))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }

                return (
                    <Form>
                        {showProfile && (
                            <PatientProfileHeader
                                values={values}
                                showBack={showBack}
                            />
                        )}

                        <PatientFormStepper
                            steps={[...FORM_STEPS]}
                            current={step}
                            onStepChange={(index) => {
                                if (index <= step) {
                                    setStep(index)
                                    window.scrollTo({
                                        top: 0,
                                        behavior: 'smooth',
                                    })
                                }
                            }}
                        />

                        <FormContainer>
                            <fieldset
                                disabled={!canWritePatient}
                                className="min-w-0 border-0 p-0 m-0 contents"
                            >
                            {step === 0 ? (
                                <PatientFormSection
                                    title="Datos personales"
                                    icon={<HiOutlineUser />}
                                    accent="sky"
                                >
                                    <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                                        <FormItem
                                            label="Expediente"
                                            extra={
                                                isEdit
                                                    ? undefined
                                                    : 'Se asigna al guardar si lo dejas vacío'
                                            }
                                        >
                                            <Field
                                                type="text"
                                                name="recordNumber"
                                                placeholder="P-000001"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Sexo">
                                            <Select
                                                placeholder="Seleccionar"
                                                options={sexOptions}
                                                value={sexOptions.filter(
                                                    (option) =>
                                                        option.value ===
                                                        values.sex,
                                                )}
                                                onChange={(option) =>
                                                    setFieldValue(
                                                        'sex',
                                                        option?.value || '',
                                                    )
                                                }
                                            />
                                        </FormItem>
                                        <FormItem
                                            asterisk
                                            label="Nombres"
                                            invalid={Boolean(
                                                errors.firstName &&
                                                    touched.firstName,
                                            )}
                                            errorMessage={errors.firstName}
                                        >
                                            <Field
                                                type="text"
                                                name="firstName"
                                                placeholder="Nombres"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem
                                            asterisk
                                            label="Apellidos"
                                            invalid={Boolean(
                                                errors.lastName &&
                                                    touched.lastName,
                                            )}
                                            errorMessage={errors.lastName}
                                        >
                                            <Field
                                                type="text"
                                                name="lastName"
                                                placeholder="Apellidos"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Fecha de nacimiento">
                                            <DatePicker
                                                inputFormat="DD/MM/YYYY"
                                                placeholder="DD/MM/YYYY"
                                                value={
                                                    values.dateOfBirth
                                                        ? dayjs(
                                                              values.dateOfBirth,
                                                          ).toDate()
                                                        : null
                                                }
                                                onChange={(date) =>
                                                    setFieldValue(
                                                        'dateOfBirth',
                                                        date
                                                            ? dayjs(date).format(
                                                                  'YYYY-MM-DD',
                                                              )
                                                            : '',
                                                    )
                                                }
                                            />
                                        </FormItem>
                                        <FormItem label="Ocupación">
                                            <Field
                                                type="text"
                                                name="occupation"
                                                placeholder="Ocupación"
                                                component={Input}
                                            />
                                        </FormItem>
                                    </div>
                                </PatientFormSection>
                            ) : null}

                            {step === 1 ? (
                                <PatientFormSection
                                    title="Contacto"
                                    icon={<HiOutlinePhone />}
                                    accent="emerald"
                                >
                                    <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                                        <FormItem label="Celular">
                                            <Field
                                                type="text"
                                                name="mobile"
                                                placeholder="7777-0000"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Teléfono">
                                            <Field
                                                type="text"
                                                name="phone"
                                                placeholder="2222-0000"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label="Correo"
                                            invalid={Boolean(
                                                errors.email && touched.email,
                                            )}
                                            errorMessage={errors.email}
                                        >
                                            <Field
                                                type="email"
                                                name="email"
                                                placeholder="correo@ejemplo.com"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Referido por">
                                            <Field
                                                type="text"
                                                name="referredBy"
                                                placeholder="Quién lo refirió"
                                                component={Input}
                                            />
                                        </FormItem>
                                        {canReadReferrals && (
                                            <FormItem
                                                label="Fuente de referido"
                                                className="md:col-span-2"
                                            >
                                                <Select
                                                    isClearable
                                                    placeholder="Seleccionar fuente"
                                                    options={
                                                        referralSourceOptions
                                                    }
                                                    value={referralSourceOptions.filter(
                                                        (option) =>
                                                            option.value ===
                                                            values.referralSourceId,
                                                    )}
                                                    onChange={(option) =>
                                                        setFieldValue(
                                                            'referralSourceId',
                                                            option?.value ??
                                                                null,
                                                        )
                                                    }
                                                />
                                            </FormItem>
                                        )}
                                        <FormItem
                                            label="Dirección"
                                            className="md:col-span-2"
                                        >
                                            <Field
                                                type="text"
                                                name="address"
                                                placeholder="Colonia, calle, número"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Municipio / ciudad">
                                            <Field
                                                type="text"
                                                name="city"
                                                placeholder="San Salvador"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="Departamento">
                                            <Select
                                                isClearable
                                                placeholder="Seleccionar"
                                                options={departmentOptions}
                                                value={departmentOptions.filter(
                                                    (option) =>
                                                        option.value ===
                                                        values.department,
                                                )}
                                                onChange={(option) =>
                                                    setFieldValue(
                                                        'department',
                                                        option?.value || '',
                                                    )
                                                }
                                            />
                                        </FormItem>
                                    </div>
                                </PatientFormSection>
                            ) : null}

                            {step === 2 ? (
                                <PatientFormSection
                                    title="Datos fiscales y notas clínicas"
                                    icon={<HiOutlineDocumentText />}
                                    accent="amber"
                                >
                                    <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                                        <FormItem label="DUI">
                                            <Field
                                                type="text"
                                                name="dui"
                                                placeholder="00000000-0"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem label="NIT">
                                            <Field
                                                type="text"
                                                name="nit"
                                                placeholder="0000-000000-000-0"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label="Alergias"
                                            className="md:col-span-2"
                                        >
                                            <Field
                                                textArea
                                                name="allergies"
                                                placeholder="Alergias conocidas"
                                                component={Input}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label="Notas"
                                            className="md:col-span-2"
                                        >
                                            <Field
                                                textArea
                                                name="notes"
                                                placeholder="Observaciones de la ficha"
                                                component={Input}
                                            />
                                        </FormItem>
                                    </div>
                                </PatientFormSection>
                            ) : null}
                            </fieldset>
                        </FormContainer>

                        <StickyFooter
                            className="flex items-center justify-between gap-3 py-4"
                            stickyClass="border-t bg-white/95 dark:bg-gray-800/95 backdrop-blur border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
                        >
                            <Button
                                type="button"
                                onClick={() => navigate('/pacientes')}
                            >
                                {canWritePatient ? 'Cancelar' : 'Volver'}
                            </Button>
                            <div className="flex flex-wrap items-center gap-2">
                                {canWritePatient && step > 0 ? (
                                    <Button type="button" onClick={goBack}>
                                        Atrás
                                    </Button>
                                ) : null}
                                {canWritePatient && !isLastStep ? (
                                    <Button
                                        type="button"
                                        variant="solid"
                                        onClick={goNext}
                                    >
                                        Continuar
                                    </Button>
                                ) : null}
                                {canWritePatient && isLastStep ? (
                                    <Button
                                        variant="solid"
                                        loading={isSubmitting}
                                        type="button"
                                        onClick={() => submitForm()}
                                    >
                                        {isEdit
                                            ? 'Guardar cambios'
                                            : 'Crear paciente'}
                                    </Button>
                                ) : null}
                            </div>
                        </StickyFooter>
                    </Form>
                )
            }}
        </Formik>
    )
}

export default PatientForm
