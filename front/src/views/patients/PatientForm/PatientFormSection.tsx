import classNames from 'classnames'
import type { ReactNode } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import IconText from '@/components/shared/IconText'

type SectionAccent = 'sky' | 'emerald' | 'amber'

const accentClass: Record<SectionAccent, string> = {
    sky: 'border-l-sky-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
}

const iconClass: Record<SectionAccent, string> = {
    sky: 'text-sky-600 dark:text-sky-300',
    emerald: 'text-emerald-600 dark:text-emerald-300',
    amber: 'text-amber-600 dark:text-amber-300',
}

type PatientFormSectionProps = {
    title: string
    icon: ReactNode
    accent: SectionAccent
    children: ReactNode
    className?: string
}

const PatientFormSection = ({
    title,
    icon,
    accent,
    children,
    className,
}: PatientFormSectionProps) => (
    <AdaptableCard
        className={classNames('h-full', className)}
        bodyClass={classNames(
            'p-5 border-l-4',
            accentClass[accent],
        )}
    >
        <IconText
            className="mb-5 text-base font-semibold"
            icon={
                <span className={classNames('text-xl', iconClass[accent])}>
                    {icon}
                </span>
            }
        >
            {title}
        </IconText>
        {children}
    </AdaptableCard>
)

export default PatientFormSection
