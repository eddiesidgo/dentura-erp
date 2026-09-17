export type ScanArch = 'UPPER' | 'LOWER' | 'FULL_ARCH' | 'OTHER'

export type PatientScan = {
    id: number
    clinicId: number
    patientId: number
    arch: ScanArch | string
    fileName: string
    contentType: string
    sizeBytes: number
    caption: string | null
    createdAt: string
    updatedAt: string
}

export type ScanUploadParams = {
    arch: ScanArch | string
    caption?: string
}
