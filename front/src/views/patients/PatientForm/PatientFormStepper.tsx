import classNames from 'classnames'
import useThemeClass from '@/utils/hooks/useThemeClass'

export type FormStep = {
    id: string
    title: string
    description: string
}

type PatientFormStepperProps = {
    steps: FormStep[]
    current: number
    onStepChange?: (index: number) => void
}

/** Indicador de fases del registro (una pantalla a la vez). */
const PatientFormStepper = ({
    steps,
    current,
    onStepChange,
}: PatientFormStepperProps) => {
    const { textTheme, bgTheme } = useThemeClass()
    const progress = steps.length > 1 ? current / (steps.length - 1) : 1

    return (
        <nav
            aria-label="Fases del registro"
            className="mb-6 rounded-2xl border border-gray-200/80 bg-white px-4 py-4 shadow-sm dark:border-gray-600 dark:bg-gray-800 md:px-5"
        >
            <div className="relative mb-4 hidden h-1 rounded-full bg-gray-100 dark:bg-gray-700 sm:block">
                <div
                    className={classNames(
                        'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
                        bgTheme,
                    )}
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {steps.map((step, index) => {
                    const active = index === current
                    const done = index < current
                    const clickable = Boolean(onStepChange) && (done || active)

                    return (
                        <li key={step.id} className="min-w-0">
                            <button
                                type="button"
                                disabled={!clickable}
                                className={classNames(
                                    'flex w-full items-start gap-3 rounded-xl px-2 py-1.5 text-left transition',
                                    active && 'bg-gray-50 dark:bg-gray-700/40',
                                    clickable &&
                                        'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30',
                                    !clickable && 'cursor-default opacity-60',
                                )}
                                onClick={() => {
                                    if (clickable && onStepChange) {
                                        onStepChange(index)
                                    }
                                }}
                            >
                                <span
                                    className={classNames(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition',
                                        active && `${bgTheme} text-white shadow-sm`,
                                        done &&
                                            !active &&
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
                                        !active &&
                                            !done &&
                                            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
                                    )}
                                >
                                    {done && !active ? '✓' : index + 1}
                                </span>
                                <span className="min-w-0 pt-0.5">
                                    <span
                                        className={classNames(
                                            'block text-sm font-semibold',
                                            active
                                                ? textTheme
                                                : 'text-gray-800 dark:text-gray-100',
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                        {step.description}
                                    </span>
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default PatientFormStepper
