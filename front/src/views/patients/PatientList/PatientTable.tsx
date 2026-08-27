import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ActionLink from '@/components/shared/ActionLink'
import DataTable from '@/components/shared/DataTable'
import TableRowActions from '@/components/shared/TableRowActions'
import { Avatar, Button, Tag } from '@/components/ui'
import { patientInitials, sexLabel, sexTagClass } from '../constants'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Patient } from '@/@types/patient'

type PatientTableProps = {
    data: Patient[]
    loading: boolean
    query: string
    pagingData: {
        total: number
        pageIndex: number
        pageSize: number
    }
    onPaginationChange: (page: number) => void
    onSelectChange: (size: number) => void
    onSort: (sort: OnSortParam) => void
    onDelete: (patient: Patient) => void
    onCreate: () => void
}

const PatientTable = ({
    data,
    loading,
    query,
    pagingData,
    onPaginationChange,
    onSelectChange,
    onSort,
    onDelete,
    onCreate,
}: PatientTableProps) => {
    const navigate = useNavigate()

    const columns: ColumnDef<Patient>[] = useMemo(
        () => [
            {
                header: 'Paciente',
                accessorKey: 'lastName',
                cell: (props) => {
                    const patient = props.row.original
                    return (
                        <div className="flex items-center gap-3 py-1">
                            <Avatar
                                size={36}
                                shape="circle"
                                className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100"
                            >
                                {patientInitials(
                                    patient.firstName,
                                    patient.lastName,
                                )}
                            </Avatar>
                            <div className="min-w-0">
                                <ActionLink
                                    to={`/pacientes/${patient.id}`}
                                    className="font-semibold"
                                >
                                    {patient.lastName}, {patient.firstName}
                                </ActionLink>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {patient.recordNumber}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'DUI',
                accessorKey: 'dui',
                enableSorting: false,
                cell: (props) => props.row.original.dui || '—',
            },
            {
                header: 'Celular',
                accessorKey: 'mobile',
                enableSorting: false,
                cell: (props) =>
                    props.row.original.mobile ||
                    props.row.original.phone ||
                    '—',
            },
            {
                header: 'Sexo',
                accessorKey: 'sex',
                enableSorting: false,
                cell: (props) => {
                    const sex = props.row.original.sex || ''
                    return (
                        <Tag
                            className={
                                sexTagClass[sex] ||
                                'bg-gray-100 text-gray-600 border-0'
                            }
                        >
                            {sexLabel(props.row.original.sex)}
                        </Tag>
                    )
                },
            },
            {
                header: 'Nacimiento',
                accessorKey: 'dateOfBirth',
                enableSorting: false,
                cell: (props) =>
                    props.row.original.dateOfBirth
                        ? dayjs(props.row.original.dateOfBirth).format(
                              'DD/MM/YYYY',
                          )
                        : '—',
            },
            {
                header: '',
                id: 'actions',
                enableSorting: false,
                cell: (props) => {
                    const patient = props.row.original
                    return (
                        <TableRowActions
                            viewTitle="Abrir ficha"
                            deleteTitle="Eliminar"
                            onView={() =>
                                navigate(`/pacientes/${patient.id}`)
                            }
                            onDelete={() => onDelete(patient)}
                        />
                    )
                },
            },
        ],
        [navigate, onDelete],
    )

    if (!loading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <p className="text-base font-semibold mb-1">
                    {query
                        ? 'Sin resultados para esta búsqueda'
                        : 'Aún no hay pacientes'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                    {query
                        ? 'Prueba con otro nombre, expediente o DUI.'
                        : 'Crea la primera ficha para empezar a agendar citas y planes de tratamiento.'}
                </p>
                {!query && (
                    <Button variant="solid" size="sm" onClick={onCreate}>
                        Nuevo paciente
                    </Button>
                )}
            </div>
        )
    }

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
        />
    )
}

export default PatientTable
