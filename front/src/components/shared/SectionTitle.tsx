import classNames from 'classnames'
import type { ReactNode } from 'react'

export type SectionTitleProps = {
    title: ReactNode
    description?: ReactNode
    extra?: ReactNode
    className?: string
}

/** Subtítulo de sección (listados / dashboard), lineamiento HESET. */
const SectionTitle = ({
    title,
    description,
    extra,
    className,
}: SectionTitleProps) => (
    <div
        className={classNames(
            'mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
            className,
        )}
    >
        <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {title}
            </h3>
            {description ? (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            ) : null}
        </div>
        {extra ? (
            <div className="flex shrink-0 flex-wrap gap-2">{extra}</div>
        ) : null}
    </div>
)

export default SectionTitle
