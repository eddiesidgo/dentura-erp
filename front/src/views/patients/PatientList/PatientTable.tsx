import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import DataTable from '@/components/shared/DataTable'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { Dropdown, Tag } from '@/components/ui'
import { sexLabel } from '../constants'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { Patient } from '@/@types/patient'

type PatientTableProps = {
    data: Patient[]
    loading: boolean
    pagingData: {
        total: number
        pageIndex: number
        pageSize: number
    }
    onPaginationChange: (page: number) => void
    onSelectChange: (size: number) => void
    onSort: (sort: OnSortParam) => void
    onDelete: (patient: Patient) => void
}

const PatientTable = ({
    data,
    loading,
    pagingData,
    onPaginationChange,
    onSelectChange,
    onSort,
    onDelete,
}: PatientTableProps) => {
    const navigate = useNavigate()

    const columns: ColumnDef<Patient>[] = useMemo(
        () => [
            {
                header: 'Expediente',
                accessorKey: 'recordNumber',
                cell: (props) => (
                    <span className="font-semibold">
                        {props.row.original.recordNumber}
                    </span>
                ),
            },
            {
                header: 'Paciente',
                accessorKey: 'lastName',
                cell: (props) => {
                    const { firstName, lastName } = props.row.original
                    return (
                        <span>
                            {lastName}, {firstName}
                        </span>
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
                cell: (props) => (
                    <Tag className="border-0">
                        {sexLabel(props.row.original.sex)}
                    </Tag>
                ),
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
                        <div className="flex justify-end">
                            <Dropdown
                                placement="bottom-end"
                                renderTitle={<EllipsisButton />}
                            >
                                <Dropdown.Item
                                    eventKey="edit"
                                    onClick={() =>
                                        navigate(`/pacientes/${patient.id}`)
                                    }
                                >
                                    Editar ficha
                                </Dropdown.Item>
                                <Dropdown.Item
                                    eventKey="delete"
                                    onClick={() => onDelete(patient)}
                                >
                                    <span className="text-red-500">
                                        Eliminar
                                    </span>
                                </Dropdown.Item>
                            </Dropdown>
                        </div>
                    )
                },
            },
        ],
        [navigate, onDelete],
    )

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
