import classNames from 'classnames'
import type { ReactNode } from 'react'

export type IconTileAccent =
    | 'sky'
    | 'emerald'
    | 'amber'
    | 'violet'
    | 'indigo'
    | 'rose'
    | 'gray'

export type IconTileProps = {
    children: ReactNode
    accent?: IconTileAccent
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const accentClass: Record<IconTileAccent, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    emerald:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    violet:
        'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    indigo:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

const sizeClass: Record<NonNullable<IconTileProps['size']>, string> = {
    sm: 'h-9 w-9 text-lg',
    md: 'h-11 w-11 text-2xl',
    lg: 'h-12 w-12 text-2xl',
}

/** Caja tintada redondeada para iconos de accesos / hubs. */
const IconTile = ({
    children,
    accent = 'indigo',
    size = 'md',
    className,
}: IconTileProps) => (
    <div
        className={classNames(
            'inline-flex items-center justify-center rounded-xl',
            sizeClass[size],
            accentClass[accent],
            className,
        )}
    >
        {children}
    </div>
)

export default IconTile
