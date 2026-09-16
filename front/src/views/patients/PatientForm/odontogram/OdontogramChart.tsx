import classNames from 'classnames'
import type { OdontogramEntry } from '@/@types/odontogram'
import {
    CONDITION_COLORS,
    STATUS_STYLES,
    getArchTeeth,
    type Dentition,
    type ToothSurface,
} from './constants'
import { resolveToothPaint } from './resolveToothPaint'
import ToothSvg from './ToothSvg'

type OdontogramChartProps = {
    dentition: Dentition
    entriesByTooth: Map<string, OdontogramEntry[]>
    canWrite: boolean
    paintMode: boolean
    onSurfaceClick: (tooth: string, surface: ToothSurface) => void
    onToothClick: (tooth: string) => void
    onInspectTooth?: (tooth: string) => void
}

const ArchRow = ({
    teeth,
    label,
    midlineGapIndex,
    entriesByTooth,
    canWrite,
    paintMode,
    onSurfaceClick,
    onToothClick,
    onInspectTooth,
}: {
    teeth: readonly string[]
    label: string
    midlineGapIndex: number
} & Omit<OdontogramChartProps, 'dentition'>) => (
    <div>
        <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Derecha del paciente ← → Izquierda
            </span>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-x-0.5 gap-y-2 sm:gap-x-1">
            {teeth.map((tooth, index) => (
                <div
                    key={tooth}
                    className={
                        index === midlineGapIndex ? 'mr-3 sm:mr-5' : undefined
                    }
                >
                    <ToothSvg
                        tooth={tooth}
                        paint={resolveToothPaint(
                            entriesByTooth.get(tooth) || [],
                        )}
                        interactive={
                            canWrite ||
                            (entriesByTooth.get(tooth)?.length || 0) > 0
                        }
                        paintMode={paintMode}
                        showInspect={Boolean(onInspectTooth)}
                        onSurfaceClick={onSurfaceClick}
                        onToothClick={onToothClick}
                        onInspect={onInspectTooth}
                    />
                </div>
            ))}
        </div>
    </div>
)

const OdontogramLegend = () => (
    <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-600 sm:grid-cols-2">
        <div>
            <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Condiciones
            </div>
            <div className="flex flex-wrap gap-2">
                {Object.entries(CONDITION_COLORS).map(([key, value]) => (
                    <span
                        key={key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: value.fill }}
                        />
                        {value.label}
                    </span>
                ))}
            </div>
        </div>
        <div>
            <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Estado
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-6 rounded-sm border-2 border-slate-600 bg-slate-100" />
                    {STATUS_STYLES.EXISTING.label}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-6 rounded-sm border-2 border-dashed border-slate-600 bg-slate-100" />
                    {STATUS_STYLES.PLANNED.label}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-6 rounded-sm border-2 border-emerald-600 bg-slate-100" />
                    {STATUS_STYLES.COMPLETED.label}
                </span>
            </div>
        </div>
    </div>
)

const OdontogramChart = ({
    dentition,
    entriesByTooth,
    canWrite,
    paintMode,
    onSurfaceClick,
    onToothClick,
    onInspectTooth,
}: OdontogramChartProps) => {
    const { upper, lower, midlineGapIndex } = getArchTeeth(dentition)

    return (
        <div
            className={classNames(
                'rounded-xl border bg-gradient-to-b from-slate-50 to-white p-3 dark:from-slate-900/40 dark:to-slate-800/30 sm:p-4',
                paintMode
                    ? 'border-sky-300 dark:border-sky-500/50'
                    : 'border-slate-200 dark:border-slate-600',
            )}
        >
            <ArchRow
                teeth={upper}
                label="Arcada superior"
                midlineGapIndex={midlineGapIndex}
                entriesByTooth={entriesByTooth}
                canWrite={canWrite}
                paintMode={paintMode}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                onInspectTooth={onInspectTooth}
            />
            <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    Línea media
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
            </div>
            <ArchRow
                teeth={lower}
                label="Arcada inferior"
                midlineGapIndex={midlineGapIndex}
                entriesByTooth={entriesByTooth}
                canWrite={canWrite}
                paintMode={paintMode}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                onInspectTooth={onInspectTooth}
            />
            <OdontogramLegend />
        </div>
    )
}

export default OdontogramChart
