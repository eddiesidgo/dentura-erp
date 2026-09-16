import { Dialog, Tag } from '@/components/ui'
import type { OdontogramEntry } from '@/@types/odontogram'
import {
    CONDITION_COLORS,
    SURFACE_LABELS,
    SURFACE_OPTIONS,
    getSurfaceMap,
    type ToothSurface,
} from './constants'
import { resolveToothPaint } from './resolveToothPaint'
import ToothSvg from './ToothSvg'

type ToothLabDialogProps = {
    tooth: string | null
    entries: OdontogramEntry[]
    canWrite: boolean
    paintMode: boolean
    onClose: () => void
    onSurfaceClick: (tooth: string, surface: ToothSurface) => void
    onToothClick: (tooth: string) => void
}

const conditionLabel = (condition: string) =>
    CONDITION_COLORS[condition as keyof typeof CONDITION_COLORS]?.label ||
    condition

const ToothLabDialog = ({
    tooth,
    entries,
    canWrite,
    paintMode,
    onClose,
    onSurfaceClick,
    onToothClick,
}: ToothLabDialogProps) => {
    const open = Boolean(tooth)
    const paint = resolveToothPaint(entries)
    const map = tooth ? getSurfaceMap(tooth) : null

    return (
        <Dialog
            isOpen={open}
            width={720}
            onClose={onClose}
            onRequestClose={onClose}
        >
            {tooth && (
                <div className="px-1 pb-2">
                    <div className="mb-4">
                        <h4 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Laboratorio · Pieza {tooth}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Vista ampliada para trabajar cara por cara. El hover
                            indica la superficie (M, O, D, B, L).
                            {paintMode
                                ? ' Modo pintura activo: el clic aplica la convención.'
                                : ' Clic en una cara para editar o registrar.'}
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
                        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50/80 to-white p-6 dark:border-slate-600 dark:from-slate-900/50 dark:to-slate-800/40">
                            {map && (
                                <>
                                    <span className="mb-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
                                        ↑ {map.top} · {SURFACE_LABELS[map.top]}
                                    </span>
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <span className="max-w-[4.5rem] text-center text-[11px] font-semibold leading-tight text-slate-500">
                                            ← {map.left}
                                            <br />
                                            {SURFACE_LABELS[map.left]}
                                        </span>
                                        <ToothSvg
                                            tooth={tooth}
                                            paint={paint}
                                            size="xl"
                                            interactive={
                                                canWrite || entries.length > 0
                                            }
                                            paintMode={paintMode}
                                            onSurfaceClick={onSurfaceClick}
                                            onToothClick={onToothClick}
                                        />
                                        <span className="max-w-[4.5rem] text-center text-[11px] font-semibold leading-tight text-slate-500">
                                            {map.right} →
                                            <br />
                                            {SURFACE_LABELS[map.right]}
                                        </span>
                                    </div>
                                    <span className="mt-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
                                        ↓ {map.bottom} ·{' '}
                                        {SURFACE_LABELS[map.bottom]}
                                    </span>
                                    <span className="mt-3 text-[11px] text-slate-400">
                                        Centro = {map.center} ·{' '}
                                        {SURFACE_LABELS[map.center]}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Estado por cara
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {SURFACE_OPTIONS.map((surface) => {
                                        const face = paint.surfaces[surface]
                                        return (
                                            <button
                                                key={surface}
                                                type="button"
                                                className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2 text-left text-sm transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-600 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10"
                                                onClick={() =>
                                                    onSurfaceClick(
                                                        tooth,
                                                        surface,
                                                    )
                                                }
                                            >
                                                <span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        {surface}
                                                    </span>
                                                    <span className="ml-1.5 text-xs text-slate-400">
                                                        {SURFACE_LABELS[surface]}
                                                    </span>
                                                </span>
                                                {face ? (
                                                    <span
                                                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                                        style={{
                                                            backgroundColor:
                                                                CONDITION_COLORS[
                                                                    face
                                                                        .condition
                                                                ].fill,
                                                        }}
                                                    >
                                                        {
                                                            CONDITION_COLORS[
                                                                face.condition
                                                            ].label
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        Sana
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {paint.whole && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                                    Condición de diente completo:{' '}
                                    <strong>
                                        {
                                            CONDITION_COLORS[
                                                paint.whole.condition
                                            ].label
                                        }
                                    </strong>
                                </div>
                            )}

                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Historial ({entries.length})
                                </div>
                                <div className="max-h-48 space-y-2 overflow-y-auto">
                                    {entries.length === 0 && (
                                        <p className="text-sm text-slate-400">
                                            Sin registros en esta pieza.
                                        </p>
                                    )}
                                    {entries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-600"
                                        >
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span className="font-semibold">
                                                    {conditionLabel(
                                                        entry.condition,
                                                    )}
                                                </span>
                                                <Tag className="border-0 text-[10px]">
                                                    {entry.status}
                                                </Tag>
                                            </div>
                                            <div className="text-slate-500">
                                                Superficies:{' '}
                                                {entry.surfaces || '—'}
                                            </div>
                                            {entry.notes && (
                                                <div className="mt-1 text-slate-400">
                                                    {entry.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    )
}

export default ToothLabDialog
