import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineUserGroup } from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import IconText from '@/components/shared/IconText'
import { Button, Card, Notification, Skeleton, Tag, toast } from '@/components/ui'
import PatientTable from './PatientTable'
import PatientTableTools from './PatientTableTools'
import {
    apiDeletePatient,
    apiGetPatients,
	apiGetPatientKpis,
    getApiErrorMessage,
} from '@/services/PatientService'
import type { OnSortParam } from '@/components/shared/DataTable'
import type { Patient, PatientKpis } from '@/@types/patient'
import useThemeClass from '@/utils/hooks/useThemeClass'

type TableState = {
    pageIndex: number
    pageSize: number
    query: string
    sort: OnSortParam
}

type PatientKpiCardProps = {
	title: string
	value: number
	helper: string
	loading: boolean
}

const numberFormatter = new Intl.NumberFormat('es-SV')

const PatientKpiCard = ({ title, value, helper, loading }: PatientKpiCardProps) => (
	<Card bodyClass="p-4">
		<div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
			{title}
		</div>
		<div className="mt-2 text-2xl font-semibold">
			{loading ? <Skeleton height={28} width={60} /> : numberFormatter.format(value)}
		</div>
		<div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</div>
	</Card>
)

const PatientList = () => {
    const navigate = useNavigate()
	const { pageTitleTheme, textTheme } = useThemeClass()
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
			<div className="mb-6">
				<div className="rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
					<div className="lg:flex items-start justify-between gap-4">
						<div>
							<IconText
								className={`text-lg font-semibold mb-1 ${pageTitleTheme}`}
								icon={<HiOutlineUserGroup className={`text-xl ${textTheme}`} />}
							>
								Padrón de pacientes
							</IconText>
							<p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
								Panel operativo para recepción y seguimiento clínico.
								Combina indicadores de captación, agenda próxima e
								inactividad para priorizar acciones del equipo.
							</p>
						</div>
						<div className="mt-3 lg:mt-0">
							<Button size="sm" variant="plain" onClick={fetchKpis}>
								Actualizar KPIs
							</Button>
						</div>
					</div>
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<Tag className="border-0 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
							{numberFormatter.format(total)} paciente{total === 1 ? '' : 's'} en padrón
						</Tag>
						{tableData.query && (
							<Tag className="border-0 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
								Filtro activo: &quot;{tableData.query}&quot;
							</Tag>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
				<PatientKpiCard
					title="Pacientes totales"
					value={kpis?.totalPatients ?? 0}
					helper="Base completa en la clínica"
					loading={kpiLoading}
				/>
				<PatientKpiCard
					title="Nuevos este mes"
					value={kpis?.newPatientsThisMonth ?? 0}
					helper="Altas del mes en curso"
					loading={kpiLoading}
				/>
				<PatientKpiCard
					title="Con cita próxima"
					value={kpis?.patientsWithUpcomingAppointment ?? 0}
					helper={`Con agenda en ${kpis?.upcomingDays ?? 7} días`}
					loading={kpiLoading}
				/>
				<PatientKpiCard
					title="Pacientes inactivos"
					value={kpis?.inactivePatients ?? 0}
					helper={`Sin citas en ${kpis?.inactivityDays ?? 90} días`}
					loading={kpiLoading}
				/>
			</div>

			<AdaptableCard className="h-full" bodyClass="h-full p-5">
				<div className="lg:flex items-start justify-between gap-4 mb-6">
					<div>
						<h5 className={`mb-1 ${pageTitleTheme}`}>Listado operativo</h5>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Busca por nombre, expediente o documento y abre la ficha en un clic.
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
					query={tableData.query}
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
					onCreate={() => navigate('/pacientes/nuevo')}
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
