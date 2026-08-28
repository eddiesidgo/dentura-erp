import { useCallback, useEffect, useRef, useState } from 'react'
import { HiOutlineDocumentDownload, HiOutlineEye } from 'react-icons/hi'
import { Button, Dialog, Notification, Spinner, toast } from '@/components/ui'
import ReportDocumentView from '@/components/reports/ReportDocumentView'
import type { ReportDocument, ReportParams } from '@/@types/report'
import {
    fetchPatientQuotationReport,
    fetchWorksListReport,
    fetchWorksSummaryReport,
} from '@/services/ReportService'
import { getApiErrorMessage } from '@/services/PatientService'
import { downloadElementAsPdf } from '@/utils/downloadElementAsPdf'

export type ReportPreviewKind = 'works-list' | 'works-summary' | 'quotation'

type ReportPreviewModalProps = {
    isOpen: boolean
    onClose: () => void
    kind: ReportPreviewKind
    params?: ReportParams
    patientId?: number
    downloadFilename: string
}

const loadReport = async (
    kind: ReportPreviewKind,
    params?: ReportParams,
    patientId?: number,
): Promise<ReportDocument> => {
    switch (kind) {
        case 'works-list':
            return fetchWorksListReport(params)
        case 'works-summary':
            return fetchWorksSummaryReport(params)
        case 'quotation':
            if (patientId == null) {
                throw new Error('Paciente no definido')
            }
            return fetchPatientQuotationReport(patientId)
    }
}

const ReportPreviewModal = ({
    isOpen,
    onClose,
    kind,
    params,
    patientId,
    downloadFilename,
}: ReportPreviewModalProps) => {
    const documentRef = useRef<HTMLDivElement>(null)
    const [report, setReport] = useState<ReportDocument | null>(null)
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const paramsKey = JSON.stringify(params ?? {})

    useEffect(() => {
        if (!isOpen) {
            setReport(null)
            return
        }

        let cancelled = false
        setLoading(true)
        loadReport(kind, params, patientId)
            .then((data) => {
                if (!cancelled) {
                    setReport(data)
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    toast.push(
                        <Notification type="danger" title="No se pudo cargar el reporte">
                            {getApiErrorMessage(error, 'Intenta de nuevo')}
                        </Notification>,
                    )
                    onClose()
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [isOpen, kind, patientId, paramsKey, onClose])

    const handleDownload = useCallback(async () => {
        const node = documentRef.current
        if (!node) {
            return
        }
        setDownloading(true)
        try {
            await downloadElementAsPdf(node, downloadFilename)
            toast.push(
                <Notification type="success" title="PDF descargado">
                    El documento se guardó en tu equipo.
                </Notification>,
            )
        } catch {
            toast.push(
                <Notification type="danger" title="No se pudo descargar">
                    Intenta de nuevo o usa imprimir desde el navegador.
                </Notification>,
            )
        } finally {
            setDownloading(false)
        }
    }, [downloadFilename])

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={960}
            contentClassName="p-0 overflow-hidden flex flex-col max-h-[92vh]"
            closable
        >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div className="flex items-center gap-2 min-w-0">
                    <HiOutlineEye className="text-xl text-sky-700 shrink-0" />
                    <div className="min-w-0">
                        <h5 className="font-semibold truncate">
                            {report?.title || 'Vista previa del reporte'}
                        </h5>
                        {report?.subtitle && (
                            <p className="text-xs text-gray-500 truncate">
                                {report.subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlineDocumentDownload />}
                        loading={downloading}
                        disabled={!report || loading}
                        onClick={handleDownload}
                    >
                        Descargar PDF
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100/90 p-4 sm:p-6 dark:bg-gray-900/50">
                {loading && (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <Spinner size={36} />
                    </div>
                )}
                {!loading && report && (
                    <ReportDocumentView ref={documentRef} document={report} />
                )}
            </div>
        </Dialog>
    )
}

export default ReportPreviewModal
