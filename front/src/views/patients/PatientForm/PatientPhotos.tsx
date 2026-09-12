import { useCallback, useEffect, useState } from 'react'
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
import { HiOutlinePhotograph, HiPlusCircle, HiTrash } from 'react-icons/hi'
import { PHOTOS_DELETE, PHOTOS_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiDeletePhoto,
    apiGetPatientPhotos,
    apiGetPhotoFile,
    apiUploadPatientPhoto,
} from '@/services/PhotoService'
import type { PatientPhoto, PhotoCategory } from '@/@types/photo'

const categoryOptions: { value: PhotoCategory | ''; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'CLINICAL', label: 'Clínicas' },
    { value: 'RVG', label: 'RVG' },
    { value: 'BEFORE_AFTER', label: 'Antes / después' },
    { value: 'OTHER', label: 'Otras' },
]

const uploadCategoryOptions = categoryOptions.filter(
    (option) => option.value !== '',
) as { value: PhotoCategory; label: string }[]

const categoryLabel = (value: string) =>
    categoryOptions.find((option) => option.value === value)?.label || value

type UploadForm = {
    category: PhotoCategory
    caption: string
    file: File | null
}

const emptyUpload: UploadForm = {
    category: 'CLINICAL',
    caption: '',
    file: null,
}

type PatientPhotosProps = {
    patientId: number
}

const PatientPhotos = ({ patientId }: PatientPhotosProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PHOTOS_WRITE])
    const canDelete = useAuthority(userAuthority, [PHOTOS_DELETE])

    const [photos, setPhotos] = useState<PatientPhoto[]>([])
    const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({})
    const [category, setCategory] = useState<PhotoCategory | ''>('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<UploadForm>(emptyUpload)
    const [toDelete, setToDelete] = useState<PatientPhoto | null>(null)

    const loadPhotos = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await apiGetPatientPhotos(
                patientId,
                category || undefined,
            )
            setPhotos(data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al obtener las fotos')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [patientId, category])

    useEffect(() => {
        loadPhotos()
    }, [loadPhotos])

    useEffect(() => {
        let cancelled = false
        const urls: string[] = []
        const loadThumbs = async () => {
            const next: Record<number, string> = {}
            await Promise.all(
                photos.map(async (photo) => {
                    try {
                        const { data } = await apiGetPhotoFile(photo.id)
                        if (cancelled) {
                            return
                        }
                        const url = URL.createObjectURL(data)
                        urls.push(url)
                        next[photo.id] = url
                    } catch {
                        /* skip broken thumb */
                    }
                }),
            )
            if (!cancelled) {
                setThumbUrls((prev) => {
                    Object.values(prev).forEach((url) => URL.revokeObjectURL(url))
                    return next
                })
            }
        }
        loadThumbs()
        return () => {
            cancelled = true
            urls.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [photos])

    const openUpload = () => {
        setForm(emptyUpload)
        setDialogOpen(true)
    }

    const saveUpload = async () => {
        if (!form.file) {
            return
        }
        setSaving(true)
        try {
            await apiUploadPatientPhoto(patientId, form.file, {
                category: form.category,
                caption: form.caption || undefined,
            })
            setDialogOpen(false)
            await loadPhotos()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo subir">
                    {getApiErrorMessage(error, 'Error al subir la foto')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!toDelete) {
            return
        }
        try {
            await apiDeletePhoto(toDelete.id)
            setToDelete(null)
            await loadPhotos()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar la foto')}
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
                            icon={<HiOutlinePhotograph className="text-lg" />}
                        >
                            Fotos del paciente
                        </IconText>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Clínicas, RVG y antes/después con acceso
                            autenticado.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 lg:mt-0">
                        <Select
                            className="min-w-[180px]"
                            size="sm"
                            options={categoryOptions}
                            value={categoryOptions.filter(
                                (option) => option.value === category,
                            )}
                            onChange={(option) =>
                                setCategory(
                                    (option?.value as PhotoCategory | '') ?? '',
                                )
                            }
                        />
                        {canWrite && (
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiPlusCircle />}
                                onClick={openUpload}
                            >
                                Subir foto
                            </Button>
                        )}
                    </div>
                </div>

                {photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                            >
                                <div className="aspect-square bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                                    {thumbUrls[photo.id] ? (
                                        <img
                                            src={thumbUrls[photo.id]}
                                            alt={photo.caption || photo.fileName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <HiOutlinePhotograph className="text-3xl text-gray-400" />
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        {categoryLabel(photo.category)}
                                    </div>
                                    <div className="text-sm font-medium truncate">
                                        {photo.caption || photo.fileName}
                                    </div>
                                    {canDelete && (
                                        <Button
                                            size="sm"
                                            className="mt-2"
                                            icon={<HiTrash />}
                                            onClick={() => setToDelete(photo)}
                                        >
                                            Eliminar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && (
                        <div className="py-12 text-center">
                            <p className="font-semibold mb-1">Sin fotos</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Sube imágenes clínicas o radiográficas.
                            </p>
                            {canWrite && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<HiPlusCircle />}
                                    onClick={openUpload}
                                >
                                    Subir foto
                                </Button>
                            )}
                        </div>
                    )
                )}
            </AdaptableCard>

            <FormDrawer
                isOpen={dialogOpen}
                accent="violet"
                icon={<HiOutlinePhotograph />}
                title="Subir foto"
                saving={saving}
                saveDisabled={!form.file}
                saveLabel="Subir"
                onClose={() => setDialogOpen(false)}
                onSave={saveUpload}
            >
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="mb-1 font-semibold">Categoría</div>
                        <Select
                            options={uploadCategoryOptions}
                            value={uploadCategoryOptions.filter(
                                (option) => option.value === form.category,
                            )}
                            onChange={(option) =>
                                setForm((prev) => ({
                                    ...prev,
                                    category:
                                        (option?.value as PhotoCategory) ||
                                        'CLINICAL',
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Archivo</div>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    file: e.target.files?.[0] || null,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <div className="mb-1 font-semibold">Descripción</div>
                        <Input
                            placeholder="Opcional"
                            value={form.caption}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    caption: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
            </FormDrawer>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar foto"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar{' '}
                    <span className="font-semibold">
                        {toDelete?.caption || toDelete?.fileName}
                    </span>
                    ?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PatientPhotos
