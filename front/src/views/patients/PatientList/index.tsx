import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import GhostButton from '@/components/shared/GhostButton'
import KpiStat from '@/components/shared/KpiStat'
import PageHeader from '@/components/shared/PageHeader'
import SectionTitle from '@/components/shared/SectionTitle'
import { Button, Notification, toast } from '@/components/ui'
import PatientTable from './PatientTable'
import PatientTableTools from './PatientTableTools'
import {
    apiDeletePatient,
    apiGetPatients,
	apiGetPatientKpis,
    getApiErrorMessage,
} from '@/services/PatientService'
import {
    PATIENTS_DELETE,
    PATIENTS_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import type { OnSortParam } from '@/components/shared/DataTable'
import type { Patient, PatientKpis } from '@/@types/patient'

type TableState = {
    pageIndex: number
    pageSize: number
    query: string
    sort: OnSortParam
}

const numberFormatter = new Intl.NumberFormat('es-SV')

const PatientList = () => {
    const navigate = useNavigate()
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PATIENTS_WRITE])
    const canDelete = useAuthority(userAuthority, [PATIENTS_DELETE])
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(false)
	const [kpiLoading, setKpiLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [toDelete, setToDelete] = useState<Patient | null>(null)
	const [kpis, setKpis] = useState<PatientKpis | null>(null)
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

	const fetchKpis = useCallback(async () => {
		setKpiLoading(true)
		try {
			const response = await apiGetPatientKpis({
				upcomingDays: 7,
				inactivityDays: 90,
			})
			setKpis(response.data)
		} catch (error) {
			toast.push(
				<Notification type="danger" title="No se pudieron cargar los indicadores">
					{getApiErrorMessage(error, 'Error al cargar indicadores de pacientes')}
				</Notification>,
			)
		} finally {
			setKpiLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchKpis()
	}, [fetchKpis])

    const handleCreate = () => {
        if (!canWrite) {
            return
        }
        navigate('/pacientes/nuevo')
    }

    const handleConfirmDelete = async () => {
        if (!toDelete || !canDelete) {
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
			<PageHeader
				title="Padrón de pacientes"
				subtitle="Pacientes"
				info="Panel operativo para recepción y seguimiento clínico. Combina indicadores de captación, agenda próxima e inactividad para priorizar acciones del equipo."
				chips={[
					`${numberFormatter.format(total)} paciente${total === 1 ? '' : 's'} en padrón`,
					...(tableData.query
						? [`Filtro activo: "${tableData.query}"`]
						: []),
				]}
			/>

			<div className="mb-6">
				<SectionTitle
					title="Indicadores"
					description="Captación, agenda próxima e inactividad"
					extra={
						<GhostButton size="sm" onClick={fetchKpis}>
							Actualizar
						</GhostButton>
					}
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<KpiStat
						label="Pacientes totales"
						value={numberFormatter.format(kpis?.totalPatients ?? 0)}
						sublabel="Base completa en la clínica"
						loading={kpiLoading}
						accent="sky"
					/>
					<KpiStat
						label="Nuevos este mes"
						value={numberFormatter.format(kpis?.newPatientsThisMonth ?? 0)}
						sublabel="Altas del mes en curso"
						loading={kpiLoading}
						accent="indigo"
					/>
					<KpiStat
						label="Con cita próxima"
						value={numberFormatter.format(
							kpis?.patientsWithUpcomingAppointment ?? 0,
						)}
						sublabel={`Con agenda en ${kpis?.upcomingDays ?? 7} días`}
						loading={kpiLoading}
						accent="emerald"
					/>
					<KpiStat
						label="Pacientes inactivos"
						value={numberFormatter.format(kpis?.inactivePatients ?? 0)}
						sublabel={`Sin citas en ${kpis?.inactivityDays ?? 90} días`}
						loading={kpiLoading}
						accent="slate"
					/>
				</div>
			</div>

			<AdaptableCard className="h-full" bodyClass="h-full p-4 sm:p-5">
				<div className="lg:flex items-start justify-between gap-4 mb-6">
					<div>
						<h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
							Listado operativo
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Busca por nombre, expediente o documento y abre la ficha en un clic.
						</p>
					</div>
					<PatientTableTools
						canCreate={canWrite}
						onSearch={(query) =>
							setTableData((prev) => ({
								...prev,
								query,
								pageIndex: 1,
							}))
						}
						onCreate={handleCreate}
					/>
				</div>
				<PatientTable
					data={patients}
					loading={loading}
					query={tableData.query}
					canCreate={canWrite}
					canDelete={canDelete}
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
					onCreate={handleCreate}
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
