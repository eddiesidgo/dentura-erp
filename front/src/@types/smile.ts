export type SmileStyle = 'OVAL' | 'SQUARE' | 'TRIANGULAR' | 'HOLLYWOOD'

export type ToothTransform = {
    tooth: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    shape?: SmileStyle | string
}

export type SmileDesignDocument = {
    style: SmileStyle | string
    archWidth: number
    toothLength: number
    midlineOffset: number
    gingivalHeight?: number
    incisalCurve?: number
    suggestedBy?: string
    teeth: ToothTransform[]
    selectedTooth?: string | null
}

export type SmileDesign = {
    id: number
    clinicId: number
    patientId: number
    scanId: number | null
    name: string
    status: 'DRAFT' | 'EXPORTED' | string
    designJson: string
    exportFileName: string | null
    exportContentType: string | null
    exportSizeBytes: number | null
    hasExport: boolean
    version: number
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type SmileDesignPayload = {
    patientId: number
    scanId?: number | null
    name: string
    designJson: string
    notes?: string | null
}

export type SmileSuggestPayload = {
    style: SmileStyle | string
    archWidth?: number
    toothLength?: number
    midlineOffset?: number
}
