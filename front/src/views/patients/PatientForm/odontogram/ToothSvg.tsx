import { useState } from 'react'
import classNames from 'classnames'
import {
    ENAMEL_FILL,
    ENAMEL_STROKE,
    CONDITION_COLORS,
    STATUS_STYLES,
    SURFACE_LABELS,
    getSurfaceMap,
    getToothKind,
    type ToothSurface,
} from './constants'
import type { ToothPaint, SurfacePaint } from './resolveToothPaint'

export type ToothSvgSize = 'sm' | 'md' | 'lg' | 'xl'

type ToothSvgProps = {
    tooth: string
    paint: ToothPaint
    interactive?: boolean
    paintMode?: boolean
    size?: ToothSvgSize
    /** Hide FDI caption under the crown (useful in mouth/denture layouts). */
    showLabel?: boolean
    /** Remove hover plate background for embedded layouts. */
    bare?: boolean
    onSurfaceClick?: (tooth: string, surface: ToothSurface) => void
    onToothClick?: (tooth: string) => void
}

const fillFor = (paint: SurfacePaint | null) =>
    paint ? CONDITION_COLORS[paint.condition].fill : ENAMEL_FILL

const strokeFor = (paint: SurfacePaint | null, fallback = ENAMEL_STROKE) => {
    if (!paint) {
        return fallback
    }
    if (paint.status === 'COMPLETED') {
        return '#059669'
    }
    return '#475569'
}

const dashFor = (paint: SurfacePaint | null) =>
    paint ? STATUS_STYLES[paint.status].strokeDasharray : undefined

const widthFor = (paint: SurfacePaint | null, hovered: boolean) => {
    const base = paint ? STATUS_STYLES[paint.status].strokeWidth : 1.1
    return hovered ? base + 1.1 : base
}

const sizeClass: Record<ToothSvgSize, string> = {
    sm: 'h-12 w-9',
    md: 'h-14 w-11 sm:h-16 sm:w-12',
    lg: 'h-40 w-32',
    xl: 'h-64 w-52 sm:h-80 sm:w-64',
}

/** Refined crown outlines with cusp hints for posteriors. */
export const surfacePaths = {
    molar: {
        top: 'M7 11 C11 3.5, 29 3.5, 33 11 L29 18.5 L11 18.5 Z',
        left: 'M7 11 L11 18.5 L11 33.5 L7 41 C3.5 33, 3.5 18, 7 11 Z',
        right: 'M33 11 L29 18.5 L29 33.5 L33 41 C36.5 33, 36.5 18, 33 11 Z',
        bottom: 'M11 33.5 L29 33.5 L33 41 C28.5 48.5, 11.5 48.5, 7 41 Z',
        center: 'M11 18.5 L29 18.5 L29 33.5 L11 33.5 Z',
        outline:
            'M7 11 C11 3.5, 29 3.5, 33 11 C36.5 18, 36.5 33, 33 41 C28.5 48.5, 11.5 48.5, 7 41 C3.5 33, 3.5 18, 7 11 Z',
        cusps: 'M14 18.5 L14 24 M20 18.5 L20 25.5 M26 18.5 L26 24',
    },
    premolar: {
        top: 'M9.5 12 C14 4.5, 26 4.5, 30.5 12 L26.5 19 L13.5 19 Z',
        left: 'M9.5 12 L13.5 19 L13.5 33 L9.5 40.5 C6 33, 6 18.5, 9.5 12 Z',
        right: 'M30.5 12 L26.5 19 L26.5 33 L30.5 40.5 C34 33, 34 18.5, 30.5 12 Z',
        bottom: 'M13.5 33 L26.5 33 L30.5 40.5 C26.5 46.5, 13.5 46.5, 9.5 40.5 Z',
        center: 'M13.5 19 L26.5 19 L26.5 33 L13.5 33 Z',
        outline:
            'M9.5 12 C14 4.5, 26 4.5, 30.5 12 C34 18.5, 34 33, 30.5 40.5 C26.5 46.5, 13.5 46.5, 9.5 40.5 C6 33, 6 18.5, 9.5 12 Z',
        cusps: 'M17 19 L17 24 M23 19 L23 24',
    },
    canine: {
        top: 'M12 9 C16.5 1.5, 23.5 1.5, 28 9 L24 16.5 L16 16.5 Z',
        left: 'M12 9 L16 16.5 L16 34 L11.5 42.5 C8 34, 8 16.5, 12 9 Z',
        right: 'M28 9 L24 16.5 L24 34 L28.5 42.5 C32 34, 32 16.5, 28 9 Z',
        bottom: 'M16 34 L24 34 L28.5 42.5 C24.5 48.5, 15.5 48.5, 11.5 42.5 Z',
        center: 'M16 16.5 L24 16.5 L24 34 L16 34 Z',
        outline:
            'M12 9 C16.5 1.5, 23.5 1.5, 28 9 C32 16.5, 32 34, 28.5 42.5 C24.5 48.5, 15.5 48.5, 11.5 42.5 C8 34, 8 16.5, 12 9 Z',
        cusps: '',
    },
    incisor: {
        top: 'M12.5 11 C16 3.5, 24 3.5, 27.5 11 L24.5 17.5 L15.5 17.5 Z',
        left: 'M12.5 11 L15.5 17.5 L15.5 35 L12.5 42.5 C9 35, 9 17.5, 12.5 11 Z',
        right: 'M27.5 11 L24.5 17.5 L24.5 35 L27.5 42.5 C31 35, 31 17.5, 27.5 11 Z',
        bottom: 'M15.5 35 L24.5 35 L27.5 42.5 C24 47.5, 16 47.5, 12.5 42.5 Z',
        center: 'M15.5 17.5 L24.5 17.5 L24.5 35 L15.5 35 Z',
        outline:
            'M12.5 11 C16 3.5, 24 3.5, 27.5 11 C31 17.5, 31 35, 27.5 42.5 C24 47.5, 16 47.5, 12.5 42.5 C9 35, 9 17.5, 12.5 11 Z',
        cusps: '',
    },
} as const

const ToothSvg = ({
    tooth,
    paint,
    interactive = true,
    paintMode = false,
    size = 'md',
    showLabel = true,
    bare = false,
    onSurfaceClick,
    onToothClick,
}: ToothSvgProps) => {
    const [hovered, setHovered] = useState<ToothSurface | null>(null)
    const kind = getToothKind(tooth)
    const paths = surfacePaths[kind]
    const map = getSurfaceMap(tooth)
    const whole = paint.whole
    const dimmed = whole?.condition === 'MISSING'
    const large = size === 'lg' || size === 'xl'
    const cursor = !interactive
        ? 'default'
        : paintMode
          ? 'crosshair'
          : 'pointer'

    const handleSurface = (surface: ToothSurface) => {
        if (!interactive) {
            return
        }
        onSurfaceClick?.(tooth, surface)
    }

    const renderSlot = (visual: keyof typeof map, d: string) => {
        const surface = map[visual]
        const surfacePaint = paint.surfaces[surface]
        const effective = dimmed ? whole : surfacePaint || whole
        const isHovered = hovered === surface
        return (
            <path
                key={visual}
                d={d}
                fill={
                    isHovered && !surfacePaint && !dimmed
                        ? '#e0f2fe'
                        : fillFor(dimmed ? whole : surfacePaint)
                }
                fillOpacity={
                    dimmed
                        ? 0.55
                        : isHovered
                          ? 1
                          : surfacePaint
                            ? 0.92
                            : 1
                }
                stroke={isHovered ? '#0284c7' : strokeFor(effective)}
                strokeWidth={widthFor(effective, isHovered)}
                strokeDasharray={dashFor(effective)}
                className="transition-[fill,stroke,stroke-width,fill-opacity] duration-150"
                style={{ cursor }}
                onMouseEnter={() => setHovered(surface)}
                onMouseLeave={() =>
                    setHovered((prev) => (prev === surface ? null : prev))
                }
                onClick={(event) => {
                    event.stopPropagation()
                    handleSurface(surface)
                }}
            >
                <title>{`Pieza ${tooth} · ${surface} · ${SURFACE_LABELS[surface]}`}</title>
            </path>
        )
    }

    return (
        <div
            className={classNames(
                'group relative flex flex-col items-center gap-0.5 rounded-lg p-0.5 transition',
                !bare &&
                    (paintMode
                        ? 'hover:bg-sky-50 dark:hover:bg-sky-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'),
            )}
            role="group"
            aria-label={`Diente ${tooth}`}
            onMouseLeave={() => setHovered(null)}
        >
            {hovered && (
                <div
                    className={classNames(
                        'pointer-events-none absolute z-20 rounded-md bg-slate-900 px-2 py-1 text-white shadow-lg',
                        large
                            ? 'left-1/2 top-2 -translate-x-1/2 text-sm'
                            : '-top-1 left-1/2 -translate-x-1/2 -translate-y-full text-[10px]',
                    )}
                >
                    <span className="font-bold">{hovered}</span>
                    <span className="opacity-80">
                        {' '}
                        · {SURFACE_LABELS[hovered]}
                    </span>
                </div>
            )}

            <svg
                viewBox="0 0 40 52"
                className={sizeClass[size]}
                role="img"
                aria-label={`Diente ${tooth}`}
                onClick={() => interactive && onToothClick?.(tooth)}
                style={{ cursor }}
            >
                {renderSlot('top', paths.top)}
                {renderSlot('left', paths.left)}
                {renderSlot('right', paths.right)}
                {renderSlot('bottom', paths.bottom)}
                {renderSlot('center', paths.center)}

                {paths.cusps && !dimmed && (
                    <path
                        d={paths.cusps}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="0.7"
                        pointerEvents="none"
                    />
                )}

                <path
                    d={paths.outline}
                    fill="none"
                    stroke={
                        whole
                            ? CONDITION_COLORS[whole.condition].fill
                            : hovered
                              ? '#0284c7'
                              : ENAMEL_STROKE
                    }
                    strokeWidth={whole ? 2 : hovered ? 1.8 : 1.35}
                    strokeDasharray={
                        whole?.condition === 'EXTRACTION_PLANNED'
                            ? '3 2'
                            : dashFor(whole)
                    }
                    pointerEvents="none"
                />

                {whole?.condition === 'MISSING' && (
                    <g stroke="#475569" strokeWidth="2" pointerEvents="none">
                        <line x1="12" y1="14" x2="28" y2="38" />
                        <line x1="28" y1="14" x2="12" y2="38" />
                    </g>
                )}

                {whole?.condition === 'EXTRACTION_PLANNED' && (
                    <g
                        stroke="#ea580c"
                        strokeWidth="1.75"
                        strokeDasharray="3 2"
                        pointerEvents="none"
                    >
                        <line x1="13" y1="15" x2="27" y2="37" />
                        <line x1="27" y1="15" x2="13" y2="37" />
                    </g>
                )}

                {whole?.condition === 'ENDO' && (
                    <line
                        x1="20"
                        y1="12"
                        x2="20"
                        y2="40"
                        stroke="#0f766e"
                        strokeWidth="2.5"
                        pointerEvents="none"
                    />
                )}

                {whole?.condition === 'IMPLANT' && (
                    <g
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth="1.6"
                        pointerEvents="none"
                    >
                        <rect x="16" y="18" width="8" height="16" rx="1" />
                        <line x1="16" y1="22" x2="24" y2="22" />
                        <line x1="16" y1="26" x2="24" y2="26" />
                        <line x1="16" y1="30" x2="24" y2="30" />
                    </g>
                )}

                {whole?.condition === 'CROWN' && (
                    <path
                        d={paths.outline}
                        fill="none"
                        stroke="#ca8a04"
                        strokeWidth="2.4"
                        pointerEvents="none"
                    />
                )}
            </svg>

            {showLabel ? (
                <div className="flex flex-col items-center gap-0.5">
                    <span
                        className={classNames(
                            'font-semibold tabular-nums text-slate-600 group-hover:text-sky-700 dark:text-slate-300 dark:group-hover:text-sky-300',
                            large ? 'text-base' : 'text-[11px]',
                        )}
                    >
                        {tooth}
                    </span>
                </div>
            ) : null}
        </div>
    )
}

export default ToothSvg
