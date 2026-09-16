import type { OdontogramEntry } from '@/@types/odontogram'
import { WHOLE_TOOTH_CONDITIONS, type ToothSurface } from './constants'
import { byNewestActivity, parseSurfaces } from './resolveToothPaint'

/** Entry that owns a specific surface (explicit list, or legacy blank → O). */
export function findEntryForSurface(
    entries: OdontogramEntry[],
    surface: ToothSurface,
): OdontogramEntry | undefined {
    const sorted = [...entries].sort(byNewestActivity)

    const explicit = sorted.find((entry) => {
        if (WHOLE_TOOTH_CONDITIONS.has(entry.condition)) {
            return false
        }
        return parseSurfaces(entry.surfaces).includes(surface)
    })
    if (explicit) {
        return explicit
    }

    if (surface === 'O') {
        return sorted.find(
            (entry) =>
                !WHOLE_TOOTH_CONDITIONS.has(entry.condition) &&
                parseSurfaces(entry.surfaces).length === 0,
        )
    }

    return undefined
}

export function findWholeToothEntry(
    entries: OdontogramEntry[],
): OdontogramEntry | undefined {
    return [...entries]
        .sort(byNewestActivity)
        .find((entry) => WHOLE_TOOTH_CONDITIONS.has(entry.condition))
}

/** Remove one surface letter from a surfaces string; null if none left. */
export function removeSurface(
    surfaces: string | null | undefined,
    surface: ToothSurface,
): string | null {
    const next = parseSurfaces(surfaces)
        .filter((item) => item !== surface)
        .join('')
    return next || null
}
