import type {
    OdontogramCondition,
    OdontogramStatus,
} from '@/@types/odontogram'

export type Dentition = 'permanent' | 'primary'

export const UPPER_PERMANENT = [
    '18',
    '17',
    '16',
    '15',
    '14',
    '13',
    '12',
    '11',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
] as const

export const LOWER_PERMANENT = [
    '48',
    '47',
    '46',
    '45',
    '44',
    '43',
    '42',
    '41',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
] as const

/** Deciduous FDI: 55–51 | 61–65 / 85–81 | 71–75 */
export const UPPER_PRIMARY = [
    '55',
    '54',
    '53',
    '52',
    '51',
    '61',
    '62',
    '63',
    '64',
    '65',
] as const

export const LOWER_PRIMARY = [
    '85',
    '84',
    '83',
    '82',
    '81',
    '71',
    '72',
    '73',
    '74',
    '75',
] as const

export const SURFACE_OPTIONS = ['M', 'O', 'D', 'B', 'L'] as const

export type ToothSurface = (typeof SURFACE_OPTIONS)[number]

export const SURFACE_LABELS: Record<ToothSurface, string> = {
    M: 'Mesial',
    O: 'Oclusal / Incisal',
    D: 'Distal',
    B: 'Vestibular',
    L: 'Lingual / Palatina',
}

export type ToothKind = 'incisor' | 'canine' | 'premolar' | 'molar'

export const WHOLE_TOOTH_CONDITIONS: ReadonlySet<OdontogramCondition> = new Set([
    'MISSING',
    'CROWN',
    'ENDO',
    'IMPLANT',
    'EXTRACTION_PLANNED',
])

export const CONDITION_COLORS: Record<
    OdontogramCondition,
    { fill: string; label: string; short: string }
> = {
    CARIES: { fill: '#dc2626', label: 'Caries', short: 'Ca' },
    FILLING: { fill: '#2563eb', label: 'Obturación', short: 'Ob' },
    MISSING: { fill: '#94a3b8', label: 'Ausente', short: 'Au' },
    CROWN: { fill: '#ca8a04', label: 'Corona', short: 'Co' },
    ENDO: { fill: '#0f766e', label: 'Endodoncia', short: 'En' },
    IMPLANT: { fill: '#0369a1', label: 'Implante', short: 'Im' },
    EXTRACTION_PLANNED: {
        fill: '#ea580c',
        label: 'Extracción planificada',
        short: 'Ex',
    },
    OTHER: { fill: '#64748b', label: 'Otro', short: 'Ot' },
}

export const STATUS_STYLES: Record<
    OdontogramStatus,
    { label: string; strokeDasharray?: string; strokeWidth: number }
> = {
    EXISTING: { label: 'Existente', strokeWidth: 1.25 },
    PLANNED: {
        label: 'Planificado',
        strokeDasharray: '3 2',
        strokeWidth: 1.75,
    },
    COMPLETED: { label: 'Completado', strokeWidth: 2.25 },
}

export const ENAMEL_FILL = '#f8fafc'
export const ENAMEL_STROKE = '#94a3b8'

export function getArchTeeth(dentition: Dentition): {
    upper: readonly string[]
    lower: readonly string[]
    midlineGapIndex: number
} {
    if (dentition === 'primary') {
        return {
            upper: UPPER_PRIMARY,
            lower: LOWER_PRIMARY,
            midlineGapIndex: 4,
        }
    }
    return {
        upper: UPPER_PERMANENT,
        lower: LOWER_PERMANENT,
        midlineGapIndex: 7,
    }
}

export function isPrimaryTooth(tooth: string): boolean {
    const quadrant = Number(tooth[0])
    return quadrant >= 5 && quadrant <= 8
}

export function getToothKind(tooth: string): ToothKind {
    const position = Number(tooth[1])
    if (position <= 2) {
        return 'incisor'
    }
    if (position === 3) {
        return 'canine'
    }
    if (isPrimaryTooth(tooth)) {
        return 'molar'
    }
    if (position <= 5) {
        return 'premolar'
    }
    return 'molar'
}

/** Maps visual slots to anatomical surfaces for the given FDI tooth. */
export function getSurfaceMap(tooth: string): Record<
    'top' | 'bottom' | 'left' | 'right' | 'center',
    ToothSurface
> {
    const quadrant = Number(tooth[0])
    const isUpper = [1, 2, 5, 6].includes(quadrant)
    const isRight = [1, 4, 5, 8].includes(quadrant)

    return {
        top: isUpper ? 'B' : 'L',
        bottom: isUpper ? 'L' : 'B',
        left: isRight ? 'D' : 'M',
        right: isRight ? 'M' : 'D',
        center: 'O',
    }
}
