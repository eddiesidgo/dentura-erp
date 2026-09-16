import type { OdontogramEntry } from '@/@types/odontogram'
import {
    SURFACE_OPTIONS,
    WHOLE_TOOTH_CONDITIONS,
    type ToothSurface,
} from './constants'
import type { OdontogramCondition, OdontogramStatus } from '@/@types/odontogram'

export type SurfacePaint = {
    condition: OdontogramCondition
    status: OdontogramStatus
    entryId: number
}

export type ToothPaint = {
    surfaces: Record<ToothSurface, SurfacePaint | null>
    whole: SurfacePaint | null
}

const emptySurfaces = (): Record<ToothSurface, SurfacePaint | null> => ({
    M: null,
    O: null,
    D: null,
    B: null,
    L: null,
})

export const parseSurfaces = (raw: string | null | undefined): ToothSurface[] => {
    if (!raw) {
        return []
    }
    return raw
        .toUpperCase()
        .split('')
        .filter((char): char is ToothSurface =>
            SURFACE_OPTIONS.includes(char as ToothSurface),
        )
}

export const byNewestActivity = (a: OdontogramEntry, b: OdontogramEntry) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt).getTime()
    return bTime - aTime
}

/**
 * Surface-type conditions without surfaces only tint the occlusal/incisal (O).
 * They must NOT flood every face — that made the first condition (often caries)
 * stick visually on the whole tooth.
 */
export function resolveToothPaint(entries: OdontogramEntry[]): ToothPaint {
    const sorted = [...entries].sort(byNewestActivity)
    const surfaces = emptySurfaces()
    let whole: SurfacePaint | null = null

    for (const entry of sorted) {
        const paint: SurfacePaint = {
            condition: entry.condition,
            status: entry.status,
            entryId: entry.id,
        }
        const listed = parseSurfaces(entry.surfaces)

        if (WHOLE_TOOTH_CONDITIONS.has(entry.condition)) {
            if (!whole) {
                whole = paint
            }
            continue
        }

        const targets: ToothSurface[] =
            listed.length > 0 ? listed : (['O'] as ToothSurface[])

        for (const surface of targets) {
            if (!surfaces[surface]) {
                surfaces[surface] = paint
            }
        }
    }

    return { surfaces, whole }
}
