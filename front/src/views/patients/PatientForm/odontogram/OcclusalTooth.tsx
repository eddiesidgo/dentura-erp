import { useState } from 'react'
import classNames from 'classnames'
import {
    CONDITION_COLORS,
    ENAMEL_FILL,
    ENAMEL_STROKE,
    STATUS_STYLES,
    SURFACE_LABELS,
    getSurfaceMap,
    getToothKind,
    type ToothKind,
    type ToothSurface,
} from './constants'
import type { ToothPaint, SurfacePaint } from './resolveToothPaint'

type OcclusalToothProps = {
    tooth: string
    paint: ToothPaint
    interactive?: boolean
    paintMode?: boolean
    /** Highlight wisdom teeth like the reference chart. */
    wisdom?: boolean
    onSurfaceClick?: (tooth: string, surface: ToothSurface) => void
    onToothClick?: (tooth: string) => void
}

const fillFor = (paint: SurfacePaint | null, fallback: string) =>
    paint ? CONDITION_COLORS[paint.condition].fill : fallback

const strokeFor = (paint: SurfacePaint | null) => {
    if (!paint) {
        return '#1e293b'
    }
    if (paint.status === 'COMPLETED') {
        return '#059669'
    }
    return '#334155'
}

const dashFor = (paint: SurfacePaint | null) =>
    paint ? STATUS_STYLES[paint.status].strokeDasharray : undefined

const widthFor = (paint: SurfacePaint | null, hovered: boolean) => {
    const base = paint ? STATUS_STYLES[paint.status].strokeWidth : 1.15
    return hovered ? base + 0.9 : base
}

/** Occlusal silhouettes + five hit zones (top/left/right/bottom/center). */
const OCCLUSAL: Record<
    ToothKind,
    {
        outline: string
        fissures: string
        top: string
        left: string
        right: string
        bottom: string
        center: string
        viewBox: string
    }
> = {
    molar: {
        viewBox: '0 0 44 44',
        outline:
            'M8 6 H36 Q40 6 40 10 V34 Q40 38 36 38 H8 Q4 38 4 34 V10 Q4 6 8 6 Z',
        fissures:
            'M22 8 V36 M8 22 H36 M14 14 L30 30 M30 14 L14 30 M16 10 Q22 16 28 10 M16 34 Q22 28 28 34',
        top: 'M8 6 H36 Q40 6 40 10 L34 18 H10 L4 10 Q4 6 8 6 Z',
        bottom: 'M10 26 H34 L40 34 Q40 38 36 38 H8 Q4 38 4 34 Z',
        left: 'M4 10 Q4 6 8 6 L10 18 V26 L8 38 Q4 38 4 34 Z',
        right: 'M36 6 Q40 6 40 10 V34 Q40 38 36 38 L34 26 V18 Z',
        center: 'M10 18 H34 V26 H10 Z',
    },
    premolar: {
        viewBox: '0 0 36 40',
        outline:
            'M10 5 H26 Q32 5 32 11 V29 Q32 35 26 35 H10 Q4 35 4 29 V11 Q4 5 10 5 Z',
        fissures: 'M18 7 V33 M8 20 H28 M12 12 L24 28 M24 12 L12 28',
        top: 'M10 5 H26 Q32 5 32 11 L26 16 H10 L4 11 Q4 5 10 5 Z',
        bottom: 'M10 24 H26 L32 29 Q32 35 26 35 H10 Q4 35 4 29 Z',
        left: 'M4 11 Q4 5 10 5 L10 16 V24 L10 35 Q4 35 4 29 Z',
        right: 'M26 5 Q32 5 32 11 V29 Q32 35 26 35 V24 V16 Z',
        center: 'M10 16 H26 V24 H10 Z',
    },
    canine: {
        viewBox: '0 0 32 38',
        outline:
            'M16 3 L26 12 Q29 16 28 22 L24 34 Q22 36 16 36 Q10 36 8 34 L4 22 Q3 16 6 12 Z',
        fissures: 'M16 6 V34 M10 18 H22',
        top: 'M16 3 L26 12 L16 16 L6 12 Z',
        bottom: 'M8 26 L16 30 L24 26 L24 34 Q22 36 16 36 Q10 36 8 34 Z',
        left: 'M6 12 L16 16 L16 30 L8 26 L4 22 Q3 16 6 12 Z',
        right: 'M26 12 Q29 16 28 22 L24 26 L16 30 V16 Z',
        center: 'M12 16 H20 V26 H12 Z',
    },
    incisor: {
        viewBox: '0 0 28 36',
        outline:
            'M8 4 H20 Q24 4 24 8 V28 Q24 33 20 34 H8 Q4 33 4 28 V8 Q4 4 8 4 Z',
        fissures: 'M14 6 V32 M9 18 H19',
        top: 'M8 4 H20 Q24 4 24 8 L20 14 H8 L4 8 Q4 4 8 4 Z',
        bottom: 'M8 22 H20 L24 28 Q24 33 20 34 H8 Q4 33 4 28 Z',
        left: 'M4 8 Q4 4 8 4 V14 V22 L8 34 Q4 33 4 28 Z',
        right: 'M20 4 Q24 4 24 8 V28 Q24 33 20 34 V22 V14 Z',
        center: 'M8 14 H20 V22 H8 Z',
    },
}

const sizeByKind: Record<ToothKind, string> = {
    molar: 'h-[42px] w-[42px] sm:h-[48px] sm:w-[48px]',
    premolar: 'h-[38px] w-[34px] sm:h-[44px] sm:w-[40px]',
    canine: 'h-[40px] w-[30px] sm:h-[46px] sm:w-[34px]',
    incisor: 'h-[38px] w-[26px] sm:h-[44px] sm:w-[30px]',
}

const OcclusalTooth = ({
    tooth,
    paint,
    interactive = true,
    paintMode = false,
    wisdom = false,
    onSurfaceClick,
    onToothClick,
}: OcclusalToothProps) => {
    const [hovered, setHovered] = useState<ToothSurface | null>(null)
    const kind = getToothKind(tooth)
    const paths = OCCLUSAL[kind]
    const map = getSurfaceMap(tooth)
    const whole = paint.whole
    const dimmed = whole?.condition === 'MISSING'
    const baseFill = wisdom ? '#dbeafe' : ENAMEL_FILL
    const [, , vbW, vbH] = paths.viewBox.split(' ').map(Number)
    const cursor = !interactive
        ? 'default'
        : paintMode
          ? 'crosshair'
          : 'pointer'

    const renderSlot = (
        visual: 'top' | 'left' | 'right' | 'bottom' | 'center',
        d: string,
    ) => {
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
                        : fillFor(dimmed ? whole : surfacePaint, baseFill)
                }
                fillOpacity={dimmed ? 0.5 : surfacePaint ? 0.92 : 1}
                stroke={isHovered ? '#0284c7' : strokeFor(effective)}
                strokeWidth={widthFor(effective, isHovered)}
                strokeDasharray={dashFor(effective)}
                style={{ cursor }}
                onMouseEnter={() => setHovered(surface)}
                onMouseLeave={() =>
                    setHovered((prev) => (prev === surface ? null : prev))
                }
                onClick={(event) => {
                    event.stopPropagation()
                    if (!interactive) {
                        return
                    }
                    onSurfaceClick?.(tooth, surface)
                }}
            >
                <title>{`Pieza ${tooth} · ${surface} · ${SURFACE_LABELS[surface]}`}</title>
            </path>
        )
    }

    return (
        <div
            className="group relative"
            role="group"
            aria-label={`Diente ${tooth}`}
            onMouseLeave={() => setHovered(null)}
        >
            {hovered && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] text-white shadow-lg">
                    <span className="font-bold">{hovered}</span>
                    <span className="opacity-80">
                        {' '}
                        · {SURFACE_LABELS[hovered]}
                    </span>
                </div>
            )}
            <svg
                viewBox={paths.viewBox}
                className={classNames(
                    sizeByKind[kind],
                    'drop-shadow-sm transition',
                    paintMode && 'group-hover:drop-shadow-md',
                )}
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

                <path
                    d={paths.fissures}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    opacity={dimmed ? 0.25 : 0.55}
                    pointerEvents="none"
                />

                <path
                    d={paths.outline}
                    fill="none"
                    stroke={
                        whole
                            ? CONDITION_COLORS[whole.condition].fill
                            : ENAMEL_STROKE
                    }
                    strokeWidth={whole ? 2.2 : 1.6}
                    strokeDasharray={
                        whole?.condition === 'EXTRACTION_PLANNED'
                            ? '3 2'
                            : dashFor(whole)
                    }
                    pointerEvents="none"
                />

                {whole?.condition === 'MISSING' && (
                    <g
                        stroke="#475569"
                        strokeWidth="2"
                        pointerEvents="none"
                        strokeLinecap="round"
                    >
                        <line
                            x1={vbW * 0.22}
                            y1={vbH * 0.22}
                            x2={vbW * 0.78}
                            y2={vbH * 0.78}
                        />
                        <line
                            x1={vbW * 0.78}
                            y1={vbH * 0.22}
                            x2={vbW * 0.22}
                            y2={vbH * 0.78}
                        />
                    </g>
                )}

                {whole?.condition === 'ENDO' && (
                    <line
                        x1={vbW * 0.5}
                        y1={vbH * 0.2}
                        x2={vbW * 0.5}
                        y2={vbH * 0.8}
                        stroke="#0f766e"
                        strokeWidth="2.2"
                        pointerEvents="none"
                    />
                )}

                {whole?.condition === 'IMPLANT' && (
                    <rect
                        x={vbW * 0.32}
                        y={vbH * 0.28}
                        width={vbW * 0.36}
                        height={vbH * 0.44}
                        rx="1"
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth="1.6"
                        pointerEvents="none"
                    />
                )}
            </svg>
        </div>
    )
}

export default OcclusalTooth
