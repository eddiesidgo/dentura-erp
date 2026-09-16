import classNames from 'classnames'
import type {
    OdontogramCondition,
    OdontogramStatus,
} from '@/@types/odontogram'
import { CONDITION_COLORS, STATUS_STYLES, WHOLE_TOOTH_CONDITIONS } from './constants'

type OdontogramToolbarProps = {
    canWrite: boolean
    activeCondition: OdontogramCondition | null
    activeStatus: OdontogramStatus
    onConditionChange: (condition: OdontogramCondition | null) => void
    onStatusChange: (status: OdontogramStatus) => void
}

const OdontogramToolbar = ({
    canWrite,
    activeCondition,
    activeStatus,
    onConditionChange,
    onStatusChange,
}: OdontogramToolbarProps) => {
    if (!canWrite) {
        return null
    }

    return (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800/40">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Convenciones
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {activeCondition
                            ? `Modo rápido: clic en diente/superficie aplica «${CONDITION_COLORS[activeCondition].label}»`
                            : 'Sin convención: el clic abre el formulario detallado'}
                    </p>
                </div>
                {activeCondition && (
                    <button
                        type="button"
                        className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
                        onClick={() => onConditionChange(null)}
                    >
                        Limpiar selección
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {(
                    Object.keys(CONDITION_COLORS) as OdontogramCondition[]
                ).map((condition) => {
                    const meta = CONDITION_COLORS[condition]
                    const selected = activeCondition === condition
                    const whole = WHOLE_TOOTH_CONDITIONS.has(condition)
                    return (
                        <button
                            key={condition}
                            type="button"
                            title={
                                whole
                                    ? `${meta.label} (diente completo)`
                                    : `${meta.label} (por superficie)`
                            }
                            className={classNames(
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                                selected
                                    ? 'border-transparent text-white shadow-sm'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500',
                            )}
                            style={
                                selected
                                    ? { backgroundColor: meta.fill }
                                    : undefined
                            }
                            onClick={() =>
                                onConditionChange(
                                    selected ? null : condition,
                                )
                            }
                        >
                            <span
                                className="h-2.5 w-2.5 rounded-sm border border-black/10"
                                style={{
                                    backgroundColor: selected
                                        ? 'rgba(255,255,255,0.85)'
                                        : meta.fill,
                                }}
                            />
                            {meta.label}
                        </button>
                    )
                })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado
                </span>
                {(Object.keys(STATUS_STYLES) as OdontogramStatus[]).map(
                    (status) => {
                        const selected = activeStatus === status
                        return (
                            <button
                                key={status}
                                type="button"
                                className={classNames(
                                    'rounded-md border px-2 py-1 text-[11px] font-medium transition',
                                    selected
                                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-100'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:text-slate-300',
                                )}
                                onClick={() => onStatusChange(status)}
                            >
                                {STATUS_STYLES[status].label}
                            </button>
                        )
                    },
                )}
            </div>
        </div>
    )
}

export default OdontogramToolbar
