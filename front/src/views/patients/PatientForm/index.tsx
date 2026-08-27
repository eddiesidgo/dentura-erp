import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import dayjs from 'dayjs'
import {
    HiOutlineClipboardList,
    HiOutlineDocumentText,
    HiOutlinePhone,
    HiOutlineUser,
} from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import IconText from '@/components/shared/IconText'
import Loading from '@/components/shared/Loading'
import StickyFooter from '@/components/shared/StickyFooter'
import {
    Alert,
    Avatar,
    Button,
    DatePicker,
    FormContainer,
    FormItem,
    Input,
    Notification,
    Select,
    Tabs,
    Tag,
    toast,
} from '@/components/ui'
import {
    apiCreatePatient,
    apiGetPatient,
    apiUpdatePatient,
    getApiErrorMessage,
} from '@/services/PatientService'
import {
    departmentOptions,
    patientInitials,
    sexOptions,
} from '../constants'
import type { PatientPayload } from '@/@types/patient'
import PatientWorks from './PatientWorks'
import { WORKS_READ } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import useThemeClass from '@/utils/hooks/useThemeClass'

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
    allergies: string
    notes: string
}

const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('El nombre es obligatorio'),
    lastName: Yup.string().required('El apellido es obligatorio'),
    email: Yup.string().email('Correo inválido'),
})

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
    allergies: values.allergies || null,
    notes: values.notes || null,
})

const PatientIdentity = ({ values }: { values: FormModel }) => {
    const { textTheme, bgTheme } = useThemeClass()
    const name =
        values.lastName || values.firstName
            ? `${values.lastName}${values.lastName && values.firstName ? ', ' : ''}${values.firstName}`
            : 'Nueva ficha'
    return (
        <AdaptableCard className="mb-4" bodyClass="p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-4">
                <Avatar
                    size={56}
                    shape="circle"
                    className={`${bgTheme} bg-opacity-15 ${textTheme} text-lg font-semibold`}
                >
                    {patientInitials(values.firstName, values.lastName)}
                </Avatar>
                <div className="min-w-0 flex-1">
                    <h4 className="mb-1 truncate">{name}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                        {values.recordNumber && (
                            <Tag className="border-0 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                                {values.recordNumber}
                            </Tag>
                        )}
                        {values.mobile && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {values.mobile}
                            </span>
                        )}
                        {values.allergies.trim() && (
                            <Tag className="border-0 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100">
                                Alergias
                            </Tag>
                        )}
                    </div>
                </div>
            </div>
        </AdaptableCard>
    )
}

const SectionTitle = ({
    icon,
    children,
}: {
    icon: React.ReactNode
    children: React.ReactNode
}) => (
    <IconText className="mb-5 text-base font-semibold" icon={icon}>
        {children}
    </IconText>
)

const PatientForm = () => {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const isEdit = Boolean(patientId)
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canReadWorks = useAuthority(userAuthority, [WORKS_READ])
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
            {isEdit && canReadWorks ? (
                <>
                    <PatientIdentity values={initialValues} />
                    <Tabs defaultValue="datos">
                        <Tabs.TabList>
                            <Tabs.TabNav
                                value="datos"
                                icon={<HiOutlineUser />}
                            >
                                Datos
                            </Tabs.TabNav>
                            <Tabs.TabNav
                                value="trabajos"
                                icon={<HiOutlineClipboardList />}
                            >
                                Trabajos
                            </Tabs.TabNav>
                        </Tabs.TabList>
                        <div className="mt-5">
                            <Tabs.TabContent value="datos">
                                <PatientDataForm
                                    isEdit
                                    initialValues={initialValues}
                                    showIdentity={false}
                                />
                            </Tabs.TabContent>
                            <Tabs.TabContent value="trabajos">
                                <PatientWorks patientId={Number(patientId)} />
                            </Tabs.TabContent>
                        </div>
                    </Tabs>
                </>
            ) : (
                <PatientDataForm
                    showIdentity
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
    showIdentity,
}: {
    isEdit: boolean
    initialValues: FormModel
    showIdentity: boolean
}) => {
    const navigate = useNavigate()
    const { patientId } = useParams()

    return (
        <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
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
            {({ values, touched, errors, isSubmitting, setFieldValue }) => (
                <Form>
                    {showIdentity && <PatientIdentity values={values} />}
                    <FormContainer>
                        {values.allergies.trim() && (
                            <Alert showIcon type="danger" className="mb-4">
                                Alergias registradas: {values.allergies}
                            </Alert>
                        )}
                        <AdaptableCard className="mb-4" bodyClass="p-5">
                            <SectionTitle icon={<HiOutlineUser />}>
                                Datos personales
                            </SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
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
                                                option.value === values.sex,
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
                                        errors.firstName && touched.firstName,
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
                                        errors.lastName && touched.lastName,
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
                        </AdaptableCard>

                        <AdaptableCard className="mb-4" bodyClass="p-5">
                            <SectionTitle icon={<HiOutlinePhone />}>
                                Contacto
                            </SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
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
                        </AdaptableCard>

                        <AdaptableCard className="mb-4" bodyClass="p-5">
                            <SectionTitle icon={<HiOutlineDocumentText />}>
                                Datos fiscales y notas clínicas
                            </SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
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
                        </AdaptableCard>
                    </FormContainer>
                    <StickyFooter
                        className="flex items-center justify-between py-4"
                        stickyClass="border-t bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                        <Button
                            type="button"
                            onClick={() => navigate('/pacientes')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={isSubmitting}
                            type="submit"
                        >
                            {isEdit ? 'Guardar cambios' : 'Crear paciente'}
                        </Button>
                    </StickyFooter>
                </Form>
            )}
        </Formik>
    )
}

export default PatientForm
