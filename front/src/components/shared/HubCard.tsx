import classNames from 'classnames'
import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import { useConfig } from '@/components/ui/ConfigProvider'

export type HubCardAccent =
    | 'primary'
    | 'sky'
    | 'emerald'
    | 'amber'
    | 'violet'
    | 'rose'
    | 'indigo'

export type HubCardChip = {
    label: string
    icon?: ComponentType<SVGProps<SVGSVGElement>>
}

export type HubCardProps = {
    to: string
    title: string
    description: string
    icon: ComponentType<{ className?: string }>
    action?: string
    badge?: string
    accent?: HubCardAccent
    chips?: HubCardChip[]
    className?: string
}

type Tone = {
    icon: string
    badge: string
    hover: string
    action: string
    blob: string
    chip: string
}

const FIXED_TONES: Record<Exclude<HubCardAccent, 'primary'>, Tone> = {
    sky: {
        icon: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
        badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
        hover: 'hover:border-sky-300 dark:hover:border-sky-700',
        action: 'text-sky-600 dark:text-sky-400',
        blob: '#0284c7',
        chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    },
    emerald: {
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        action: 'text-emerald-600 dark:text-emerald-400',
        blob: '#059669',
        chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    amber: {
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        hover: 'hover:border-amber-300 dark:hover:border-amber-700',
        action: 'text-amber-600 dark:text-amber-400',
        blob: '#d97706',
        chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
    violet: {
        icon: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
        hover: 'hover:border-violet-300 dark:hover:border-violet-700',
        action: 'text-violet-600 dark:text-violet-400',
        blob: '#7c3aed',
        chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    },
    rose: {
        icon: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
        hover: 'hover:border-rose-300 dark:hover:border-rose-700',
        action: 'text-rose-600 dark:text-rose-400',
        blob: '#e11d48',
        chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    },
    indigo: {
        icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
        badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
        hover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        action: 'text-indigo-600 dark:text-indigo-400',
        blob: '#4f46e5',
        chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
}

/**
 * Tarjeta de acceso tipo SettingsHubCard (HESET): hover lift, blob y CTA.
 */
const HubCard = ({
    to,
    title,
    description,
    icon: Icon,
    action = 'Abrir',
    badge,
    accent = 'primary',
    chips = [],
    className,
}: HubCardProps) => {
    const { themeColor, primaryColorLevel } = useConfig()
    const primaryVar = `var(--color-${themeColor}-${primaryColorLevel})`
    const primaryTone: Tone = {
        icon: '',
        badge: '',
        hover: '',
        action: '',
        blob: primaryVar,
        chip: '',
    }
    const tone = accent === 'primary' ? primaryTone : FIXED_TONES[accent]
    const usePrimaryStyles = accent === 'primary'

    const content = (
        <Card
            bordered
            className={classNames(
                'relative h-full overflow-hidden border-slate-200/90 shadow-none transition duration-150 dark:border-slate-700',
                'hover:-translate-y-0.5 hover:shadow-md',
                !usePrimaryStyles && tone.hover,
                className,
            )}
            bodyClass="relative h-full"
        >
            <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.12]"
                style={{ background: tone.blob }}
            />
            <div className="relative flex h-full flex-col gap-3 p-0.5">
                <div className="flex items-start justify-between gap-2">
                    <span
                        className={classNames(
                            'flex h-11 w-11 items-center justify-center rounded-2xl',
                            !usePrimaryStyles && tone.icon,
                        )}
                        style={
                            usePrimaryStyles
                                ? {
                                      backgroundColor: `color-mix(in srgb, ${primaryVar} 14%, transparent)`,
                                      color: primaryVar,
                                  }
                                : undefined
                        }
                    >
                        <Icon className="text-2xl" />
                    </span>
                    {badge ? (
                        <span
                            className={classNames(
                                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                !usePrimaryStyles && tone.badge,
                            )}
                            style={
                                usePrimaryStyles
                                    ? {
                                          backgroundColor: `color-mix(in srgb, ${primaryVar} 12%, transparent)`,
                                          color: primaryVar,
                                      }
                                    : undefined
                            }
                        >
                            {badge}
                        </span>
                    ) : null}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                    {chips.length > 0 ? (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                            {chips.map((chip) => {
                                const ChipIcon = chip.icon
                                return (
                                    <li
                                        key={chip.label}
                                        className={classNames(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                            !usePrimaryStyles && tone.chip,
                                        )}
                                        style={
                                            usePrimaryStyles
                                                ? {
                                                      backgroundColor: `color-mix(in srgb, ${primaryVar} 8%, transparent)`,
                                                      color: primaryVar,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {ChipIcon ? (
                                            <ChipIcon className="text-sm" />
                                        ) : null}
                                        {chip.label}
                                    </li>
                                )
                            })}
                        </ul>
                    ) : null}
                </div>
                <p
                    className={classNames(
                        'mt-1 flex items-center gap-1 text-sm font-semibold',
                        !usePrimaryStyles && tone.action,
                    )}
                    style={usePrimaryStyles ? { color: primaryVar } : undefined}
                >
                    {action}
                    <HiArrowRight className="text-base transition group-hover:translate-x-0.5" />
                </p>
            </div>
        </Card>
    )

    return (
        <Link to={to} className="group block h-full no-underline hover:no-underline">
            {content}
        </Link>
    )
}

export default HubCard
