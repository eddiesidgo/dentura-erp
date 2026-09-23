import classNames from 'classnames'
import type { ReactNode } from 'react'
import Skeleton from '@/components/ui/Skeleton'

export type KpiAccent =
    | 'sky'
    | 'amber'
    | 'emerald'
    | 'violet'
    | 'indigo'
    | 'slate'

export type KpiStatProps = {
    label: string
    value: ReactNode
    sublabel?: string
    accent?: KpiAccent
    loading?: boolean
    className?: string
}

const accentValue: Record<KpiAccent, string> = {
    sky: 'text-sky-600 dark:text-sky-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    slate: 'text-slate-600 dark:text-slate-300',
}

/** KPI tile al estilo KpiCardRow de HESET. */
const KpiStat = ({
    label,
    value,
    sublabel,
    accent = 'sky',
    loading = false,
    className,
}: KpiStatProps) => (
    <div
        className={classNames(
            'rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition dark:border-gray-600 dark:bg-gray-800',
            'hover:border-gray-300 hover:shadow dark:hover:bg-gray-800',
            className,
        )}
    >
        <p className="text-xs uppercase tracking-wide opacity-50">{label}</p>
        <p
            className={classNames(
                'mt-1 text-2xl font-semibold',
                accentValue[accent],
            )}
        >
            {loading ? <Skeleton height={28} width={60} /> : value}
        </p>
        {sublabel ? (
            <p className="mt-0.5 truncate text-xs opacity-50">{sublabel}</p>
        ) : null}
    </div>
)

export default KpiStat
