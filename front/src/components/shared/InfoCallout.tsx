import classNames from 'classnames'
import type { ReactNode } from 'react'
import { useConfig } from '@/components/ui/ConfigProvider'

export type InfoCalloutProps = {
    title?: ReactNode
    children: ReactNode
    icon?: ReactNode
    className?: string
}

/** Banner informativo suave con tinte del primary (callouts de hubs HESET). */
const InfoCallout = ({ title, children, icon, className }: InfoCalloutProps) => {
    const { themeColor, primaryColorLevel } = useConfig()
    const primary = `var(--color-${themeColor}-${primaryColorLevel})`

    return (
        <div
            className={classNames(
                'flex max-w-3xl items-start gap-3 rounded-2xl border px-4 py-3',
                className,
            )}
            style={{
                borderColor: `color-mix(in srgb, ${primary} 22%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${primary} 8%, transparent)`,
            }}
        >
            {icon ? (
                <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${primary} 16%, transparent)`,
                        color: primary,
                    }}
                >
                    {icon}
                </span>
            ) : null}
            <div className="min-w-0 text-sm text-slate-600 dark:text-slate-300">
                {title ? (
                    <p className="mb-0.5 font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </p>
                ) : null}
                {children}
            </div>
        </div>
    )
}

export default InfoCallout
