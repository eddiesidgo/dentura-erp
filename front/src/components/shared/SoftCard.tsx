import classNames from 'classnames'
import Card from '@/components/ui/Card'
import type { CardProps } from '@/components/ui/Card'

export type SoftCardProps = CardProps

/**
 * Mirror of Card tuned for the analytics SaaS skin:
 * soft border, generous body padding, no heavy shadow.
 */
const SoftCard = ({
    className,
    bodyClass,
    bordered = true,
    headerBorder = false,
    ...rest
}: SoftCardProps) => (
    <Card
        bordered={bordered}
        headerBorder={headerBorder}
        className={classNames(
            'shadow-none border-gray-200/90 dark:border-gray-600',
            className,
        )}
        bodyClass={classNames('p-5 sm:p-6', bodyClass)}
        {...rest}
    />
)

export default SoftCard
