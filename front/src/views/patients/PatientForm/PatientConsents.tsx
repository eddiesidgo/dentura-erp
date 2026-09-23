import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AdaptableCard from '@/components/shared/AdaptableCard'
import {
    Button,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import { HiOutlineDocumentText, HiPlusCircle } from 'react-icons/hi'
import { PATIENTS_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import useAuthority from '@/utils/hooks/useAuthority'
import { getApiErrorMessage } from '@/services/PatientService'
import ApiService from '@/services/ApiService'
import {
    apiCreateConsentTemplate,
    apiCreatePatientConsent,
    apiGetConsentTemplates,
    apiGetPatientConsents,
} from '@/services/ClinicalService'
import type { ConsentTemplate, PatientConsent } from '@/@types/clinical'

type Props = { patientId: number }

const PatientConsents = ({ patientId }: Props) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const canWrite = useAuthority(userAuthority, [PATIENTS_WRITE])
    const [templates, setTemplates] = useState<ConsentTemplate[]>([])
    const [consents, setConsents] = useState<PatientConsent[]>([])
    const [templateId, setTemplateId] = useState<number | undefined>()
    const [signerName, setSignerName] = useState('')
    const [notes, setNotes] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newBody, setNewBody] = useState(
        '<p>Autorizo el tratamiento dental propuesto y declaro haber recibido información sobre riesgos y alternativas.</p>',
    )
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        try {
            const [templatesRes, consentsRes] = await Promise.all([
                apiGetConsentTemplates(true),
                apiGetPatientConsents(patientId),
            ])
            setTemplates(templatesRes.data)
            setConsents(consentsRes.data)
            if (!templateId && templatesRes.data.length > 0) {
                setTemplateId(templatesRes.data[0].id)
            }
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error consentimientos')}
                </Notification>,
            )
        }
    }, [patientId, templateId])

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId])

    const createTemplate = async () => {
        if (!newTitle.trim()) {
            toast.push(
                <Notification type="warning" title="Título requerido">
                    Indicá un título para la plantilla.
                </Notification>,
            )
            return
        }
        setSaving(true)
        try {
            const { data } = await apiCreateConsentTemplate({
                title: newTitle.trim(),
                bodyHtml: newBody,
            })
            setNewTitle('')
            setTemplateId(data.id)
            await load()
            toast.push(
                <Notification type="success" title="Plantilla creada">
                    Ya podés registrar consentimientos con esta plantilla.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo crear plantilla">
                    {getApiErrorMessage(error, 'Error')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const register = async () => {
        if (!templateId) {
            toast.push(
                <Notification type="warning" title="Plantilla requerida">
                    Seleccioná o creá una plantilla primero.
                </Notification>,
            )
            return
        }
        if (!signerName.trim()) {
            toast.push(
                <Notification type="warning" title="Firmante requerido">
                    Indicá el nombre de quien firma.
                </Notification>,
            )
            return
        }
        setSaving(true)
        try {
            await apiCreatePatientConsent({
                patientId,
                templateId,
                signerName: signerName.trim(),
                notes: notes || null,
            })
            setSignerName('')
            setNotes('')
            await load()
            toast.push(
                <Notification type="success" title="Registrado">
                    Consentimiento guardado.
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo registrar">
                    {getApiErrorMessage(error, 'Error')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const openPdf = async (id: number) => {
        try {
            const { data } = await ApiService.fetchData<Blob>({
                url: `/consents/${id}/pdf`,
                method: 'get',
                responseType: 'blob',
            })
            const url = URL.createObjectURL(data)
            window.open(url, '_blank', 'noopener,noreferrer')
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo abrir PDF">
                    {getApiErrorMessage(error, 'Error PDF')}
                </Notification>,
            )
        }
    }

    const templateOptions = templates.map((template) => ({
        value: template.id,
        label: template.title,
    }))

    return (
        <AdaptableCard className="mb-4" bodyClass="p-5">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold">
                <HiOutlineDocumentText />
                Consentimientos
            </div>

            {canWrite && templates.length === 0 && (
                <div className="mb-5 space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
                    <p className="text-sm text-slate-500">
                        No hay plantillas. Creá una para esta clínica.
                    </p>
                    <Input
                        placeholder="Título"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <Input
                        textArea
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                    />
                    <Button
                        type="button"
                        loading={saving}
                        onClick={createTemplate}
                    >
                        Crear plantilla
                    </Button>
                </div>
            )}

            {canWrite && (
                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Select
                        options={templateOptions}
                        value={templateOptions.filter(
                            (option) => option.value === templateId,
                        )}
                        onChange={(option) => setTemplateId(option?.value)}
                    />
                    <Input
                        placeholder="Nombre del firmante"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="solid"
                        icon={<HiPlusCircle />}
                        loading={saving}
                        onClick={register}
                    >
                        Registrar
                    </Button>
                    <Input
                        className="md:col-span-3"
                        placeholder="Notas"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-slate-500">
                            <th className="px-2 py-2">Plantilla</th>
                            <th className="px-2 py-2">Firmante</th>
                            <th className="px-2 py-2">Fecha</th>
                            <th className="px-2 py-2">Notas</th>
                            <th className="px-2 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {consents.map((consent) => (
                            <tr
                                key={consent.id}
                                className="border-b border-slate-100 dark:border-slate-800"
                            >
                                <td className="px-2 py-2">
                                    {consent.templateTitle}
                                </td>
                                <td className="px-2 py-2">
                                    {consent.signerName}
                                </td>
                                <td className="whitespace-nowrap px-2 py-2">
                                    {dayjs(consent.acceptedAt).format(
                                        'DD/MM/YYYY HH:mm',
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {consent.notes || '—'}
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <Button
                                        size="xs"
                                        onClick={() => openPdf(consent.id)}
                                    >
                                        PDF
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {consents.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-2 py-8 text-center text-slate-500"
                                >
                                    Sin consentimientos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdaptableCard>
    )
}

export default PatientConsents
