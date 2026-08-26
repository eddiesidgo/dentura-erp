import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Notification, toast } from '@/components/ui'
import PatientTable from './PatientTable'
import PatientTableTools from './PatientTableTools'
import {
    apiDeletePatient,
    apiGetPatients,
    getApiErrorMessage,
} from '@/services/PatientService'
import type { OnSortParam } from '@/components/shared/DataTable'
import type { Patient } from '@/@types/patient'
import useThemeClass from '@/utils/hooks/useThemeClass'

type TableState = {
    pageIndex: number
    pageSize: number
    query: string
    sort: OnSortParam
}

const PatientList = () => {
    const navigate = useNavigate()
    const { pageTitleTheme } = useThemeClass()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [toDelete, setToDelete] = useState<Patient | null>(null)
    const [tableData, setTableData] = useState<TableState>({
        pageIndex: 1,
        pageSize: 10,
        query: '',
        sort: { order: '', key: '' },
    })
    const [total, setTotal] = useState(0)

    const fetchPatients = useCallback(async () => {
        setLoading(true)
        try {
            const sort =
                tableData.sort.order && tableData.sort.key
                    ? `${tableData.sort.key},${tableData.sort.order}`
                    : undefined
            const response = await apiGetPatients({
                q: tableData.query,
                page: tableData.pageIndex,
                size: tableData.pageSize,
                sort,
            })
            setPatients(response.data.data)
            setTotal(response.data.total)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(
                        error,
                        'Error al obtener los pacientes',
                    )}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [tableData])

    useEffect(() => {
        fetchPatients()
    }, [fetchPatients])

    const handleConfirmDelete = async () => {
        if (!toDelete) {
            return
        }
        setDeleting(true)
        try {
            await apiDeletePatient(toDelete.id)
            toast.push(
                <Notification type="success" title="Paciente eliminado">
                    Se eliminó la ficha de {toDelete.lastName},{' '}
                    {toDelete.firstName}
                </Notification>,
            )
            setToDelete(null)
            fetchPatients()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el paciente')}
                </Notification>,
            )
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            <AdaptableCard className="h-full" bodyClass="h-full">
                <div className="lg:flex items-center justify-between mb-4">
                    <div>
                        <h5 className={pageTitleTheme}>Padrón de pacientes</h5>
                        <p className="text-sm">
                            Busca, crea y edita fichas con datos personales,
                            contacto y NIT/DUI.
                        </p>
                    </div>
                    <PatientTableTools
                        onSearch={(query) =>
                            setTableData((prev) => ({
                                ...prev,
                                query,
                                pageIndex: 1,
                            }))
                        }
                        onCreate={() => navigate('/pacientes/nuevo')}
                    />
                </div>
                <PatientTable
                    data={patients}
                    loading={loading}
                    pagingData={{
                        total,
                        pageIndex: tableData.pageIndex,
                        pageSize: tableData.pageSize,
                    }}
                    onPaginationChange={(page) =>
                        setTableData((prev) => ({ ...prev, pageIndex: page }))
                    }
                    onSelectChange={(size) =>
                        setTableData((prev) => ({
                            ...prev,
                            pageSize: size,
                            pageIndex: 1,
                        }))
                    }
                    onSort={(sort) =>
                        setTableData((prev) => ({
                            ...prev,
                            sort,
                            pageIndex: 1,
                        }))
                    }
                    onDelete={setToDelete}
                />
            </AdaptableCard>
            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar paciente"
                confirmButtonColor="red-600"
                confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    ¿Eliminar la ficha de{' '}
                    <span className="font-semibold">
                        {toDelete?.lastName}, {toDelete?.firstName}
                    </span>
                    ? Esta acción no se puede deshacer.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientList
