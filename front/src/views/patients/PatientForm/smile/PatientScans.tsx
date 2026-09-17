import { useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import IconText from '@/components/shared/IconText'
import {
    Button,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import {
    HiOutlineCube,
    HiOutlineDownload,
    HiOutlineLightBulb,
    HiOutlineSave,
    HiOutlineTrash,
    HiPlusCircle,
} from 'react-icons/hi'
import {
    SCANS_DELETE,
    SCANS_WRITE,
    SMILE_DESIGN_DELETE,
    SMILE_DESIGN_WRITE,
} from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiDeleteScan,
    apiGetPatientScans,
    apiGetScanFile,
    apiUploadPatientScan,
} from '@/services/ScanService'
import {
    apiCreateSmileDesign,
    apiDeleteSmileDesign,
    apiDownloadSmileExport,
    apiGetPatientSmileDesigns,
    apiSuggestSmileDesign,
    apiUpdateSmileDesign,
    apiUploadSmileExport,
} from '@/services/SmileDesignService'
import type { PatientScan, ScanArch } from '@/@types/scan'
import type {
    SmileDesign,
    SmileDesignDocument,
    SmileStyle,
    ToothTransform,
} from '@/@types/smile'
import ScanViewer from './ScanViewer'
import SmileDesignerCanvas from './SmileDesignerCanvas'
import type { GizmoMode } from './SmileDesignerCanvas'
import { downloadBlob, geometriesToBinaryStl } from './exportStl'
import {
    createToothGeometry,
    emptyDesignDocument,
} from './toothTemplates'

const archOptions: { value: ScanArch | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'UPPER', label: 'Superior' },
    { value: 'LOWER', label: 'Inferior' },
    { value: 'FULL_ARCH', label: 'Arco completo' },
    { value: 'OTHER', label: 'Otro' },
]

const uploadArchOptions = archOptions.filter(
    (option) => option.value !== '',
) as { value: ScanArch; label: string }[]

const styleOptions: { value: SmileStyle; label: string }[] = [
    { value: 'OVAL', label: 'Ovalado' },
    { value: 'SQUARE', label: 'Cuadrado' },
    { value: 'TRIANGULAR', label: 'Triangular' },
    { value: 'HOLLYWOOD', label: 'Hollywood' },
]

const archLabel = (value: string) =>
    archOptions.find((option) => option.value === value)?.label || value

const parseDesign = (json: string): SmileDesignDocument => {
    try {
        const parsed = JSON.parse(json) as SmileDesignDocument
        return {
            ...emptyDesignDocument((parsed.style as SmileStyle) || 'OVAL'),
            ...parsed,
            teeth: parsed.teeth?.length
                ? parsed.teeth
                : emptyDesignDocument().teeth,
        }
    } catch {
        return emptyDesignDocument()
    }
}

type PatientScansProps = {
    patientId: number
}

const PatientScans = ({ patientId }: PatientScansProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWriteScan = useAuthority(userAuthority, [SCANS_WRITE])
    const canDeleteScan = useAuthority(userAuthority, [SCANS_DELETE])
    const canWriteDesign = useAuthority(userAuthority, [SMILE_DESIGN_WRITE])
    const canDeleteDesign = useAuthority(userAuthority, [SMILE_DESIGN_DELETE])

    const [scans, setScans] = useState<PatientScan[]>([])
    const [designs, setDesigns] = useState<SmileDesign[]>([])
    const [archFilter, setArchFilter] = useState<ScanArch | ''>('')
    const [loading, setLoading] = useState(false)
    const [selectedScanId, setSelectedScanId] = useState<number | null>(null)
    const [scanBlob, setScanBlob] = useState<Blob | null>(null)
    const [scanFileName, setScanFileName] = useState<string | null>(null)
    const [scanGeometry, setScanGeometry] =
        useState<THREE.BufferGeometry | null>(null)

    const [uploadOpen, setUploadOpen] = useState(false)
    const [uploadArch, setUploadArch] = useState<ScanArch>('UPPER')
    const [uploadCaption, setUploadCaption] = useState('')
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [savingUpload, setSavingUpload] = useState(false)
    const [scanToDelete, setScanToDelete] = useState<PatientScan | null>(null)

    const [activeDesignId, setActiveDesignId] = useState<number | null>(null)
    const [designName, setDesignName] = useState('Diseño de sonrisa')
    const [document, setDocument] = useState<SmileDesignDocument>(
        emptyDesignDocument(),
    )
    const [savingDesign, setSavingDesign] = useState(false)
    const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate')
    const [scanXray, setScanXray] = useState(true)
    const [focusNonce, setFocusNonce] = useState(0)
    const [designToDelete, setDesignToDelete] = useState<SmileDesign | null>(
        null,
    )

    const selectedTooth = useMemo(
        () =>
            document.teeth.find(
                (tooth) => tooth.tooth === document.selectedTooth,
            ) || null,
        [document],
    )

    const loadScans = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetPatientScans(
                patientId,
                archFilter || undefined,
            )
            setScans(data)
            setSelectedScanId((current) => {
                if (current && data.some((scan) => scan.id === current)) {
                    return current
                }
                return data[0]?.id ?? null
            })
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener scans')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId, archFilter])

    const loadDesigns = useCallback(async () => {
        try {
            const { data } = await apiGetPatientSmileDesigns(patientId)
            setDesigns(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener diseños')}
                </Notification>,
            )
        }
    }, [patientId])

    useEffect(() => {
        loadScans()
        loadDesigns()
    }, [loadScans, loadDesigns])

    useEffect(() => {
        let cancelled = false
        if (!selectedScanId) {
            setScanBlob(null)
            setScanFileName(null)
            setScanGeometry(null)
            return
        }
        const meta = scans.find((scan) => scan.id === selectedScanId)
        setScanFileName(meta?.fileName ?? null)
        apiGetScanFile(selectedScanId)
            .then(({ data }) => {
                if (cancelled) {
                    return
                }
                setScanBlob(data)
                const name = (meta?.fileName || '').toLowerCase()
                const usePly =
                    name.endsWith('.ply') ||
                    (data.type || '').toLowerCase().includes('ply')
                return data.arrayBuffer().then((buffer) => {
                    if (cancelled) {
                        return
                    }
                    const geom = usePly
                        ? new PLYLoader().parse(buffer)
                        : new STLLoader().parse(buffer)
                    geom.computeVertexNormals()
                    setScanGeometry((prev) => {
                        prev?.dispose()
                        return geom
                    })
                })
            })
            .catch(() => {
                if (!cancelled) {
                    setScanBlob(null)
                    setScanGeometry(null)
                }
            })
        return () => {
            cancelled = true
        }
    }, [selectedScanId, scans])

    const saveUpload = async () => {
        if (!uploadFile) {
            return
        }
        setSavingUpload(true)
        try {
            const { data } = await apiUploadPatientScan(patientId, uploadFile, {
                arch: uploadArch,
                caption: uploadCaption || undefined,
            })
            setUploadOpen(false)
            setUploadFile(null)
            setUploadCaption('')
            setSelectedScanId(data.id)
            await loadScans()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo subir">
                    {getApiErrorMessage(error, 'Error al subir el scan')}
                </Notification>,
            )
        } finally {
            setSavingUpload(false)
        }
    }

    const confirmDeleteScan = async () => {
        if (!scanToDelete) {
            return
        }
        try {
            await apiDeleteScan(scanToDelete.id)
            if (selectedScanId === scanToDelete.id) {
                setSelectedScanId(null)
            }
            setScanToDelete(null)
            await loadScans()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el scan')}
                </Notification>,
            )
        }
    }

    const updateTooth = (toothId: string, patch: Partial<ToothTransform>) => {
        setDocument((prev) => ({
            ...prev,
            teeth: prev.teeth.map((tooth) =>
                tooth.tooth === toothId ? { ...tooth, ...patch } : tooth,
            ),
        }))
    }

    const rebuildFromGlobals = (
        next: Partial<SmileDesignDocument>,
        keepSelection = true,
    ) => {
        setDocument((prev) => {
            const style = (next.style || prev.style) as SmileStyle
            const archWidth = next.archWidth ?? prev.archWidth
            const toothLength = next.toothLength ?? prev.toothLength
            const midlineOffset = next.midlineOffset ?? prev.midlineOffset
            const base = emptyDesignDocument(style)
            base.archWidth = archWidth
            base.toothLength = toothLength
            base.midlineOffset = midlineOffset
            base.teeth = base.teeth.map((tooth) => {
                const existing = prev.teeth.find((t) => t.tooth === tooth.tooth)
                if (!existing) {
                    return tooth
                }
                // Keep manual per-tooth overrides for rotation/shape when only globals change slightly
                return {
                    ...tooth,
                    rotation: existing.rotation,
                    shape: style,
                }
            })
            base.selectedTooth = keepSelection ? prev.selectedTooth : null
            return { ...base, ...next, teeth: base.teeth, style }
        })
    }

    const applySuggestion = async () => {
        try {
            const { data } = await apiSuggestSmileDesign(patientId, {
                style: document.style,
                archWidth: document.archWidth,
                toothLength: document.toothLength,
                midlineOffset: document.midlineOffset,
            })
            setDocument({
                ...emptyDesignDocument(data.style as SmileStyle),
                ...data,
                selectedTooth: null,
            })
            toast.push(
                <Notification type="success" title="Sugerencia aplicada">
                    Se generó un diseño según proporciones y estilo.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo sugerir">
                    {getApiErrorMessage(error, 'Error al sugerir diseño')}
                </Notification>,
            )
        }
    }

    const saveDesign = async () => {
        if (!canWriteDesign) {
            return
        }
        setSavingDesign(true)
        try {
            const payload = {
                patientId,
                scanId: selectedScanId,
                name: designName.trim() || 'Diseño de sonrisa',
                designJson: JSON.stringify({
                    ...document,
                    selectedTooth: null,
                }),
            }
            if (activeDesignId) {
                await apiUpdateSmileDesign(activeDesignId, payload)
            } else {
                const { data } = await apiCreateSmileDesign(payload)
                setActiveDesignId(data.id)
            }
            await loadDesigns()
            toast.push(
                <Notification type="success" title="Diseño guardado">
                    Versión almacenada en el expediente.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar el diseño')}
                </Notification>,
            )
        } finally {
            setSavingDesign(false)
        }
    }

    const exportStl = async () => {
        if (!canWriteDesign) {
            return
        }
        setSavingDesign(true)
        try {
            let designId = activeDesignId
            if (!designId) {
                const { data } = await apiCreateSmileDesign({
                    patientId,
                    scanId: selectedScanId,
                    name: designName.trim() || 'Diseño de sonrisa',
                    designJson: JSON.stringify({
                        ...document,
                        selectedTooth: null,
                    }),
                })
                designId = data.id
                setActiveDesignId(data.id)
            } else {
                await apiUpdateSmileDesign(designId, {
                    patientId,
                    scanId: selectedScanId,
                    name: designName.trim() || 'Diseño de sonrisa',
                    designJson: JSON.stringify({
                        ...document,
                        selectedTooth: null,
                    }),
                })
            }

            const items = document.teeth.map((tooth) => {
                const geometry = createToothGeometry(tooth.shape || document.style)
                const matrix = new THREE.Matrix4()
                const position = new THREE.Vector3(...tooth.position)
                const rotation = new THREE.Euler(...tooth.rotation)
                const scale = new THREE.Vector3(...tooth.scale)
                matrix.compose(
                    position,
                    new THREE.Quaternion().setFromEuler(rotation),
                    scale,
                )
                return { geometry, matrix }
            })
            const blob = geometriesToBinaryStl(items, 'dentura_smile')
            const file = new File([blob], `smile-${patientId}.stl`, {
                type: 'model/stl',
            })
            await apiUploadSmileExport(designId, file)
            downloadBlob(blob, file.name)
            await loadDesigns()
            toast.push(
                <Notification type="success" title="STL exportado">
                    Listo para provisional / laboratorio.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo exportar">
                    {getApiErrorMessage(error, 'Error al exportar STL')}
                </Notification>,
            )
        } finally {
            setSavingDesign(false)
        }
    }

    const openDesign = (design: SmileDesign) => {
        setActiveDesignId(design.id)
        setDesignName(design.name)
        setDocument(parseDesign(design.designJson))
        if (design.scanId) {
            setSelectedScanId(design.scanId)
        }
    }

    const confirmDeleteDesign = async () => {
        if (!designToDelete) {
            return
        }
        try {
            await apiDeleteSmileDesign(designToDelete.id)
            if (activeDesignId === designToDelete.id) {
                setActiveDesignId(null)
                setDocument(emptyDesignDocument())
            }
            setDesignToDelete(null)
            await loadDesigns()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el diseño')}
                </Notification>,
            )
        }
    }

    const downloadExistingExport = async (design: SmileDesign) => {
        try {
            const { data } = await apiDownloadSmileExport(design.id)
            downloadBlob(data, design.exportFileName || `smile-${design.id}.stl`)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo descargar">
                    {getApiErrorMessage(error, 'Error al descargar STL')}
                </Notification>,
            )
        }
    }

    return (
        <>
            <AdaptableCard className="mb-4" bodyClass="p-5">
                <div className="lg:flex items-start justify-between gap-4 mb-5">
                    <div>
                        <IconText
                            className="mb-1 text-base font-semibold"
                            icon={<HiOutlineCube className="text-lg" />}
                        >
                            Scans 3D y diseño de sonrisa
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Importa STL/PLY, visualiza en 3D, diseña con
                            plantillas y exporta para laboratorio.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 lg:mt-0">
                        <Select
                            className="min-w-[160px]"
                            size="sm"
                            options={archOptions}
                            value={archOptions.filter(
                                (option) => option.value === archFilter,
                            )}
                            onChange={(option) =>
                                setArchFilter(
                                    (option?.value as ScanArch | '') ?? '',
                                )
                            }
                        />
                        {canWriteScan && (
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiPlusCircle />}
                                onClick={() => setUploadOpen(true)}
                            >
                                Subir scan
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 mb-6">
                    <div className="space-y-2 max-h-72 overflow-auto">
                        {loading && (
                            <p className="text-sm text-gray-500">Cargando…</p>
                        )}
                        {!loading && scans.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Aún no hay scans. Sube un STL para empezar.
                            </p>
                        )}
                        {scans.map((scan) => (
                            <div
                                key={scan.id}
                                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer ${
                                    selectedScanId === scan.id
                                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                                onClick={() => setSelectedScanId(scan.id)}
                            >
                                <div>
                                    <div className="text-sm font-medium">
                                        {scan.fileName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {archLabel(scan.arch)} ·{' '}
                                        {scan.sizeBytes < 1024 * 1024
                                            ? `${(scan.sizeBytes / 1024).toFixed(1)} KB`
                                            : `${(scan.sizeBytes / (1024 * 1024)).toFixed(2)} MB`}
                                    </div>
                                </div>
                                {canDeleteScan && (
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<HiOutlineTrash />}
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            setScanToDelete(scan)
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <ScanViewer blob={scanBlob} fileName={scanFileName} />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                    <div className="flex flex-wrap items-end gap-3 mb-4">
                        <div className="min-w-[200px] flex-1">
                            <label className="mb-1 block text-xs text-gray-500">
                                Nombre del diseño
                            </label>
                            <Input
                                size="sm"
                                value={designName}
                                disabled={!canWriteDesign}
                                onChange={(e) => setDesignName(e.target.value)}
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <label className="mb-1 block text-xs text-gray-500">
                                Estilo
                            </label>
                            <Select
                                size="sm"
                                options={styleOptions}
                                value={styleOptions.filter(
                                    (option) => option.value === document.style,
                                )}
                                isDisabled={!canWriteDesign}
                                onChange={(option) =>
                                    rebuildFromGlobals({
                                        style: (option?.value as SmileStyle) || 'OVAL',
                                    })
                                }
                            />
                        </div>
                        {canWriteDesign && (
                            <>
                                <Button
                                    size="sm"
                                    icon={<HiOutlineLightBulb />}
                                    onClick={applySuggestion}
                                >
                                    Sugerir
                                </Button>
                                <Button
                                    size="sm"
                                    icon={<HiOutlineSave />}
                                    loading={savingDesign}
                                    onClick={saveDesign}
                                >
                                    Guardar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<HiOutlineDownload />}
                                    loading={savingDesign}
                                    onClick={exportStl}
                                >
                                    Exportar STL
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3 mb-4">
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">
                                Ancho de arco
                            </label>
                            <Input
                                type="number"
                                size="sm"
                                value={document.archWidth}
                                disabled={!canWriteDesign}
                                onChange={(e) =>
                                    rebuildFromGlobals({
                                        archWidth: Number(e.target.value) || 52,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">
                                Largo dental
                            </label>
                            <Input
                                type="number"
                                size="sm"
                                value={document.toothLength}
                                disabled={!canWriteDesign}
                                onChange={(e) =>
                                    rebuildFromGlobals({
                                        toothLength:
                                            Number(e.target.value) || 10.5,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">
                                Midline offset
                            </label>
                            <Input
                                type="number"
                                size="sm"
                                step="0.1"
                                value={document.midlineOffset}
                                disabled={!canWriteDesign}
                                onChange={(e) =>
                                    rebuildFromGlobals({
                                        midlineOffset:
                                            Number(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">
                            Herramienta 3D:
                        </span>
                        {(
                            [
                                { value: 'translate', label: 'Mover' },
                                { value: 'rotate', label: 'Rotar' },
                                { value: 'scale', label: 'Escalar' },
                            ] as { value: GizmoMode; label: string }[]
                        ).map((tool) => (
                            <Button
                                key={tool.value}
                                size="xs"
                                disabled={!canWriteDesign}
                                variant={
                                    gizmoMode === tool.value
                                        ? 'solid'
                                        : 'plain'
                                }
                                onClick={() => setGizmoMode(tool.value)}
                            >
                                {tool.label}
                            </Button>
                        ))}
                        <Button
                            size="xs"
                            variant={scanXray ? 'solid' : 'plain'}
                            onClick={() => setScanXray((v) => !v)}
                        >
                            Rayos X
                        </Button>
                        <Button
                            size="xs"
                            disabled={!document.selectedTooth}
                            variant="plain"
                            onClick={() => setFocusNonce((n) => n + 1)}
                        >
                            Enfocar
                        </Button>
                        <span className="text-xs text-gray-400">
                            Rueda = zoom · Clic medio + arrastrar = mover (X/Y)
                            · Click izq. = rotar · Doble clic = capas
                        </span>
                    </div>

                    <SmileDesignerCanvas
                        document={document}
                        editable={canWriteDesign}
                        focusNonce={focusNonce}
                        gizmoMode={gizmoMode}
                        scanGeometry={scanGeometry}
                        scanOpacity={scanXray ? 0.18 : 0.55}
                        onSelectTooth={(tooth) =>
                            setDocument((prev) => ({
                                ...prev,
                                selectedTooth: tooth,
                            }))
                        }
                        onToothChange={updateTooth}
                    />

                    {selectedTooth && canWriteDesign && (
                        <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="mb-3 text-sm font-semibold">
                                Edición del diente {selectedTooth.tooth}{' '}
                                <span className="font-normal text-gray-500">
                                    (también con el gizmo 3D)
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {(['x', 'y', 'z'] as const).map((axis, index) => (
                                    <div key={`pos-${axis}`}>
                                        <label className="mb-1 block text-xs text-gray-500">
                                            Posición {axis.toUpperCase()}
                                        </label>
                                        <Input
                                            type="number"
                                            size="sm"
                                            step="0.1"
                                            value={selectedTooth.position[index]}
                                            onChange={(e) => {
                                                const next = [
                                                    ...selectedTooth.position,
                                                ] as [
                                                    number,
                                                    number,
                                                    number,
                                                ]
                                                next[index] =
                                                    Number(e.target.value) || 0
                                                updateTooth(selectedTooth.tooth, {
                                                    position: next,
                                                })
                                            }}
                                        />
                                    </div>
                                ))}
                                {(['x', 'y', 'z'] as const).map((axis, index) => (
                                    <div key={`rot-${axis}`}>
                                        <label className="mb-1 block text-xs text-gray-500">
                                            Rotación {axis.toUpperCase()}
                                        </label>
                                        <Input
                                            type="number"
                                            size="sm"
                                            step="0.01"
                                            value={selectedTooth.rotation[index]}
                                            onChange={(e) => {
                                                const next = [
                                                    ...selectedTooth.rotation,
                                                ] as [
                                                    number,
                                                    number,
                                                    number,
                                                ]
                                                next[index] =
                                                    Number(e.target.value) || 0
                                                updateTooth(selectedTooth.tooth, {
                                                    rotation: next,
                                                })
                                            }}
                                        />
                                    </div>
                                ))}
                                {(['x', 'y', 'z'] as const).map((axis, index) => (
                                    <div key={`scale-${axis}`}>
                                        <label className="mb-1 block text-xs text-gray-500">
                                            Escala {axis.toUpperCase()}
                                        </label>
                                        <Input
                                            type="number"
                                            size="sm"
                                            step="0.05"
                                            value={selectedTooth.scale[index]}
                                            onChange={(e) => {
                                                const next = [
                                                    ...selectedTooth.scale,
                                                ] as [
                                                    number,
                                                    number,
                                                    number,
                                                ]
                                                next[index] =
                                                    Number(e.target.value) || 1
                                                updateTooth(selectedTooth.tooth, {
                                                    scale: next,
                                                })
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-5">
                        <h6 className="mb-2 text-sm font-semibold">
                            Diseños guardados
                        </h6>
                        {designs.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Todavía no hay diseños en este paciente.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {designs.map((design) => (
                                    <div
                                        key={design.id}
                                        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                                            activeDesignId === design.id
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="text-left"
                                            onClick={() => openDesign(design)}
                                        >
                                            <div className="text-sm font-medium">
                                                {design.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                v{design.version} · {design.status}
                                                {design.hasExport
                                                    ? ' · STL listo'
                                                    : ''}
                                            </div>
                                        </button>
                                        <div className="flex gap-1">
                                            {design.hasExport && (
                                                <Button
                                                    size="xs"
                                                    icon={<HiOutlineDownload />}
                                                    onClick={() =>
                                                        downloadExistingExport(
                                                            design,
                                                        )
                                                    }
                                                >
                                                    STL
                                                </Button>
                                            )}
                                            {canDeleteDesign && (
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<HiOutlineTrash />}
                                                    onClick={() =>
                                                        setDesignToDelete(design)
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </AdaptableCard>

            <FormDrawer
                isOpen={uploadOpen}
                accent="sky"
                icon={<HiOutlineCube />}
                title="Subir scan 3D"
                saving={savingUpload}
                saveDisabled={!uploadFile}
                saveLabel="Subir"
                onClose={() => setUploadOpen(false)}
                onSave={saveUpload}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm">Arco</label>
                        <Select
                            options={uploadArchOptions}
                            value={uploadArchOptions.filter(
                                (option) => option.value === uploadArch,
                            )}
                            onChange={(option) =>
                                setUploadArch(
                                    (option?.value as ScanArch) || 'UPPER',
                                )
                            }
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm">Caption</label>
                        <Input
                            value={uploadCaption}
                            onChange={(e) => setUploadCaption(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm">
                            Archivo STL / PLY (máx. 100 MB)
                        </label>
                        <Input
                            type="file"
                            accept=".stl,.ply,model/stl,model/ply"
                            onChange={(e) =>
                                setUploadFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(scanToDelete)}
                type="danger"
                title="Eliminar scan"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setScanToDelete(null)}
                onRequestClose={() => setScanToDelete(null)}
                onCancel={() => setScanToDelete(null)}
                onConfirm={confirmDeleteScan}
            >
                <p>
                    ¿Eliminar el scan{' '}
                    <strong>{scanToDelete?.fileName}</strong>?
                </p>
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={Boolean(designToDelete)}
                type="danger"
                title="Eliminar diseño"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setDesignToDelete(null)}
                onRequestClose={() => setDesignToDelete(null)}
                onCancel={() => setDesignToDelete(null)}
                onConfirm={confirmDeleteDesign}
            >
                <p>
                    ¿Eliminar el diseño{' '}
                    <strong>{designToDelete?.name}</strong>?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientScans
