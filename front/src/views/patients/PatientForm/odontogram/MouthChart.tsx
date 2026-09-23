import { useMemo } from 'react'
import classNames from 'classnames'
import { getArchTeeth, isPrimaryTooth } from './constants'
import { resolveToothPaint } from './resolveToothPaint'
import OcclusalTooth from './OcclusalTooth'
import { OdontogramLegend, type OdontogramChartProps } from './OdontogramChart'

const VIEW_W = 760
const VIEW_H = 640
const MID_Y = 320

type ArchKind = 'upper' | 'lower'

type ToothPlacement = {
    tooth: string
    x: number
    y: number
    rotate: number
    labelX: number
    labelY: number
    arch: ArchKind
    wisdom: boolean
}

const isWisdom = (tooth: string) => {
    if (isPrimaryTooth(tooth)) {
        return false
    }
    return tooth.endsWith('8')
}

/**
 * Place teeth on a U-arch like the classic occlusal chart.
 * Upper: opening downward. Lower: opening upward.
 * Local tooth "top" faces outward (buccal).
 */
const placeOnArch = (
    teeth: readonly string[],
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number,
    arch: ArchKind,
    labelOut: number,
): ToothPlacement[] => {
    const n = teeth.length
    if (n === 0) {
        return []
    }
    return teeth.map((tooth, index) => {
        const t = n === 1 ? 0.5 : index / (n - 1)
        const angle = startAngle + t * (endAngle - startAngle)
        const x = cx + rx * Math.cos(angle)
        const y = cy + ry * Math.sin(angle)
        const rotate =
            arch === 'upper'
                ? (angle * 180) / Math.PI + 90
                : (angle * 180) / Math.PI - 90
        const nx = Math.cos(angle)
        const ny = Math.sin(angle)
        const outward = arch === 'upper' ? -1 : 1
        return {
            tooth,
            x,
            y,
            rotate,
            labelX: x + nx * labelOut * outward,
            labelY: y + ny * labelOut * outward,
            arch,
            wisdom: isWisdom(tooth),
        }
    })
}

const ChartBackdrop = ({ primary }: { primary: boolean }) => (
    <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
    >
        <rect
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
            fill="#fafafa"
            className="dark:fill-slate-900"
        />

        <line
            x1="380"
            y1="24"
            x2="380"
            y2="616"
            stroke="#94a3b8"
            strokeWidth="1.25"
            strokeDasharray="4 3"
        />
        <line
            x1="48"
            y1={MID_Y}
            x2="712"
            y2={MID_Y}
            stroke="#94a3b8"
            strokeWidth="1.25"
            strokeDasharray="4 3"
        />

        <ellipse
            cx="380"
            cy="175"
            rx={primary ? 88 : 105}
            ry={primary ? 48 : 58}
            fill="#f9a8d4"
            fillOpacity="0.55"
            stroke="#db2777"
            strokeWidth="1"
            strokeOpacity="0.35"
        />
        <text
            x="380"
            y="180"
            textAnchor="middle"
            className="fill-pink-700 dark:fill-pink-300"
            fontSize="14"
            fontWeight="600"
        >
            Paladar
        </text>

        <path
            d={
                primary
                    ? 'M305 430 C315 470, 345 498, 380 500 C415 498, 445 470, 455 430 C438 442, 410 450, 380 450 C350 450, 322 442, 305 430 Z'
                    : 'M285 420 C300 475, 335 512, 380 516 C425 512, 460 475, 475 420 C450 440, 418 452, 380 452 C342 452, 310 440, 285 420 Z'
            }
            fill="#e2e8f0"
            fillOpacity="0.85"
            stroke="#64748b"
            strokeWidth="1.5"
        />
        <text
            x="380"
            y="468"
            textAnchor="middle"
            className="fill-slate-600 dark:fill-slate-300"
            fontSize="14"
            fontWeight="600"
        >
            Lengua
        </text>

        <text
            x="28"
            y={MID_Y}
            textAnchor="middle"
            transform={`rotate(-90 28 ${MID_Y})`}
            className="fill-slate-500"
            fontSize="13"
            fontWeight="600"
        >
            Derecha
        </text>
        <text
            x="732"
            y={MID_Y}
            textAnchor="middle"
            transform={`rotate(90 732 ${MID_Y})`}
            className="fill-slate-500"
            fontSize="13"
            fontWeight="600"
        >
            Izquierda
        </text>
    </svg>
)

const MouthChart = ({
    dentition,
    entriesByTooth,
    paintMode,
    onSurfaceClick,
    onToothClick,
}: OdontogramChartProps) => {
    const { upper, lower } = getArchTeeth(dentition)
    const primary = dentition === 'primary'

    const placements = useMemo(() => {
        const upperPlaced = placeOnArch(
            upper,
            380,
            168,
            primary ? 205 : 245,
            primary ? 88 : 108,
            Math.PI * 1.12,
            Math.PI * 1.88,
            'upper',
            primary ? 38 : 44,
        )
        const lowerPlaced = placeOnArch(
            lower,
            380,
            472,
            primary ? 205 : 245,
            primary ? 88 : 108,
            Math.PI * 0.88,
            Math.PI * 0.12,
            'lower',
            primary ? 38 : 44,
        )
        return [...upperPlaced, ...lowerPlaced]
    }, [dentition, upper, lower, primary])

    return (
        <div
            className={classNames(
                'rounded-xl border bg-white p-3 dark:bg-slate-900 sm:p-4',
                paintMode
                    ? 'border-sky-300 dark:border-sky-500/50'
                    : 'border-slate-200 dark:border-slate-600',
            )}
        >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Vista oclusal
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Derecha del paciente ← → Izquierda · clic = ampliar
                </span>
            </div>

            <div className="overflow-x-auto">
                <div
                    className="relative mx-auto min-w-[300px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                    style={{
                        width: '100%',
                        maxWidth: 760,
                        aspectRatio: `${VIEW_W} / ${VIEW_H}`,
                    }}
                >
                    <ChartBackdrop primary={primary} />

                    {placements.map((item) => (
                        <div key={item.tooth}>
                            <div
                                className="absolute z-[2]"
                                style={{
                                    left: `${(item.x / VIEW_W) * 100}%`,
                                    top: `${(item.y / VIEW_H) * 100}%`,
                                    transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                                }}
                            >
                                <OcclusalTooth
                                    tooth={item.tooth}
                                    wisdom={item.wisdom}
                                    paint={resolveToothPaint(
                                        entriesByTooth.get(item.tooth) || [],
                                    )}
                                    interactive
                                    paintMode={paintMode}
                                    onSurfaceClick={onSurfaceClick}
                                    onToothClick={onToothClick}
                                />
                            </div>
                            <span
                                className={classNames(
                                    'pointer-events-none absolute z-[3] text-[10px] font-semibold tabular-nums sm:text-[11px]',
                                    item.wisdom
                                        ? 'text-sky-600 dark:text-sky-300'
                                        : 'text-slate-600 dark:text-slate-300',
                                )}
                                style={{
                                    left: `${(item.labelX / VIEW_W) * 100}%`,
                                    top: `${(item.labelY / VIEW_H) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                {item.tooth}
                            </span>
                        </div>
                    ))}

                    {!primary && (
                        <>
                            <span className="pointer-events-none absolute left-[6%] top-[5%] z-[3] text-[9px] font-medium italic text-sky-600 dark:text-sky-300">
                                muela de juicio
                            </span>
                            <span className="pointer-events-none absolute right-[6%] top-[5%] z-[3] text-[9px] font-medium italic text-sky-600 dark:text-sky-300">
                                muela de juicio
                            </span>
                            <span className="pointer-events-none absolute bottom-[5%] left-[6%] z-[3] text-[9px] font-medium italic text-sky-600 dark:text-sky-300">
                                muela de juicio
                            </span>
                            <span className="pointer-events-none absolute bottom-[5%] right-[6%] z-[3] text-[9px] font-medium italic text-sky-600 dark:text-sky-300">
                                muela de juicio
                            </span>
                        </>
                    )}
                </div>
            </div>

            <OdontogramLegend />
        </div>
    )
}

export default MouthChart
