import classNames from 'classnames'
import type { ReactNode } from 'react'
import useThemeClass from '@/utils/hooks/useThemeClass'

export type PageHeaderProps = {
    /** Línea 1 — color primary (como h2 en HESET AppRoute). */
    title: ReactNode
    /** Línea 2 — negro / slate fuerte (como h3 subtitle en HESET). */
    subtitle?: ReactNode
    /** Línea 3 — texto más pequeño y tenue (info en HESET). */
    info?: ReactNode
    /** @deprecated Preferir `info`. Se mantiene por compatibilidad. */
    description?: ReactNode
    /** Acciones a la derecha. */
    extra?: ReactNode
    chips?: string[]
    /** Separador bajo el encabezado (default: true, como HESET). */
    divider?: boolean
    className?: string
    children?: ReactNode
}

/**
 * Encabezado de módulo al estilo HESET AppRoute:
 * title (primary) → subtitle (negro) → info (tenue).
 */
const PageHeader = ({
    title,
    subtitle,
    info,
    description,
    extra,
    chips,
    divider = true,
    className,
    children,
}: PageHeaderProps) => {
    const { textTheme } = useThemeClass()
    const detail = info ?? description

    return (
        <div className={classNames(className)}>
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                <div className="min-w-0 md:w-full">
                    <h2
                        className={classNames(
                            'mb-3 text-2xl font-bold',
                            textTheme,
                        )}
                    >
                        {title}
                    </h2>
                    {subtitle ? (
                        <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                            {subtitle}
                        </h3>
                    ) : null}
                    {detail ? (
                        <p className="max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            {detail}
                        </p>
                    ) : null}
                    {chips && chips.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {chips.map((chip) => (
                                <span
                                    key={chip}
                                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-600 shadow-sm dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    {children}
                </div>
                {extra ? (
                    <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                        {extra}
                    </div>
                ) : null}
            </div>
            {divider ? <hr className="my-6 border-gray-100 dark:border-gray-700" /> : null}
        </div>
    )
}

export default PageHeader
