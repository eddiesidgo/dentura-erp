import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineLocationMarker,
    HiOutlineMail,
    HiOutlinePhone,
} from 'react-icons/hi'
import { Avatar, Button, Tag } from '@/components/ui'
import {
    patientAge,
    patientInitials,
    patientLocation,
    sexLabel,
    sexTagClass,
} from '../constants'
import useThemeClass from '@/utils/hooks/useThemeClass'

export type PatientProfileValues = {
    recordNumber: string
    firstName: string
    lastName: string
    sex: string
    dateOfBirth: string
    phone: string
    mobile: string
    email: string
    city: string
    department: string
    allergies: string
}

type PatientProfileHeaderProps = {
    values: PatientProfileValues
    showBack?: boolean
}

const ContactChip = ({
    icon,
    label,
    iconClass,
}: {
    icon: React.ReactNode
    label: string
    iconClass: string
}) => (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/60 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
        <span className={`text-base ${iconClass}`}>{icon}</span>
        {label}
    </span>
)

const PatientProfileHeader = ({
    values,
    showBack = true,
}: PatientProfileHeaderProps) => {
    const navigate = useNavigate()
    const { textTheme, bgTheme } = useThemeClass()

    const name =
        values.lastName || values.firstName
            ? `${values.lastName}${values.lastName && values.firstName ? ', ' : ''}${values.firstName}`
            : 'Nueva ficha'

    const age = patientAge(values.dateOfBirth)
    const location = patientLocation(values.city, values.department)
    const contactPhone = values.mobile || values.phone
    const hasAllergies = Boolean(values.allergies.trim())

    return (
        <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
            <div className="px-5 py-5 md:px-6 md:py-6">
                {showBack && (
                    <Button
                        size="sm"
                        variant="plain"
                        className="mb-4 -ml-1"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/pacientes')}
                    >
                        Volver al listado
                    </Button>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar
                        size={80}
                        shape="circle"
                        className={`shrink-0 ring-2 ring-gray-100 dark:ring-gray-700 ${bgTheme} bg-opacity-15 ${textTheme} text-2xl font-semibold`}
                    >
                        {patientInitials(values.firstName, values.lastName)}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h3 className="mb-2 truncate text-xl font-bold text-gray-900 dark:text-gray-100">
                            {name}
                        </h3>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {values.recordNumber && (
                                <Tag className="border-0 bg-gray-100 font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                    {values.recordNumber}
                                </Tag>
                            )}
                            {values.sex && (
                                <Tag
                                    className={
                                        sexTagClass[values.sex] ||
                                        'border-0 bg-gray-100 text-gray-600'
                                    }
                                >
                                    {sexLabel(values.sex)}
                                </Tag>
                            )}
                            {age !== null && (
                                <Tag className="border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100">
                                    {age} años
                                </Tag>
                            )}
                            {values.dateOfBirth && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {dayjs(values.dateOfBirth).format(
                                        'DD/MM/YYYY',
                                    )}
                                </span>
                            )}
                            {hasAllergies && (
                                <Tag className="border-0 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100">
                                    Alergias
                                </Tag>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {contactPhone && (
                                <ContactChip
                                    icon={<HiOutlinePhone />}
                                    label={contactPhone}
                                    iconClass={textTheme}
                                />
                            )}
                            {values.email && (
                                <ContactChip
                                    icon={<HiOutlineMail />}
                                    label={values.email}
                                    iconClass={textTheme}
                                />
                            )}
                            {location && (
                                <ContactChip
                                    icon={<HiOutlineLocationMarker />}
                                    label={location}
                                    iconClass={textTheme}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {hasAllergies && (
                <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-500/10 dark:text-red-200">
                    <span className="font-semibold">Alergias:</span>{' '}
                    {values.allergies}
                </div>
            )}
        </div>
    )
}

export default PatientProfileHeader
