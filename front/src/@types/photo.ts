export type PhotoCategory = 'CLINICAL' | 'RVG' | 'BEFORE_AFTER' | 'OTHER'

export type PatientPhoto = {
    id: number
    clinicId: number
    patientId: number
    category: PhotoCategory | string
    fileName: string
    contentType: string
    sizeBytes: number
    caption: string | null
    takenAt: string | null
    createdAt: string
    updatedAt: string
}

export type PhotoUploadParams = {
    category: PhotoCategory | string
    caption?: string
    takenAt?: string
}
