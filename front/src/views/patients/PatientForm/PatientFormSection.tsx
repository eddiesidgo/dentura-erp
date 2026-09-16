import classNames from 'classnames'
import type { ReactNode } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import IconTile from '@/components/shared/IconTile'
import type { IconTileAccent } from '@/components/shared/IconTile'

type PatientFormSectionProps = {
    title: string
    icon: ReactNode
    accent?: IconTileAccent
    children: ReactNode
    className?: string
}

const PatientFormSection = ({
    title,
    icon,
    accent = 'sky',
    children,
    className,
}: PatientFormSectionProps) => (
    <AdaptableCard
        className={classNames('h-full', className)}
        bodyClass="p-5 md:p-6"
    >
        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700/80">
            <IconTile accent={accent} size="sm">
                {icon}
            </IconTile>
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
            </h4>
        </div>
        {children}
    </AdaptableCard>
)

export default PatientFormSection
