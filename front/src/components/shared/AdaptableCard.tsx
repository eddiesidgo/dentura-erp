import classNames from 'classnames'
import Card from '@/components/ui/Card'
import { LAYOUT_TYPE_MODERN } from '@/constants/theme.constant'
import { useAppSelector } from '@/store'
import type { CardProps } from '@/components/ui/Card'

interface AdaptableCardProps extends CardProps {
    leftSideBorder?: boolean
    rightSideBorder?: boolean
    divider?: boolean
    shadow?: boolean
    isLastChild?: boolean
}

/**
 * Card wrapper used across list/detail pages.
 * Soft analytics skin: white floating surface on gray canvas (borders stay visible).
 */
const AdaptableCard = (props: AdaptableCardProps) => {
    const {
        className,
        children,
        bodyClass,
        leftSideBorder,
        rightSideBorder,
        divider,
        shadow,
        isLastChild,
        bordered = true,
        ...rest
    } = props

    const type = useAppSelector((state) => state.theme.layout.type)
    const isModern = type === LAYOUT_TYPE_MODERN

    return (
        <Card
            bordered={bordered}
            className={classNames(
                'shadow-sm border-gray-200/90 dark:border-gray-600',
                className,
                isModern &&
                    rightSideBorder &&
                    'ltr:border-r-0 rtl:border-l-0 md:ltr:border-r md:rtl:border-l md:border-gray-200 md:dark:border-gray-600 rounded-tr-none rounded-br-none rtl:rounded-tr-none rtl:rounded-br-none',
                isModern &&
                    leftSideBorder &&
                    'ltr:border-l-0 rtl:border-r-0 md:ltr:border-l md:rtl:border-r md:border-gray-200 md:dark:border-gray-600 rounded-tl-none rounded-bl-none rtl:rounded-tl-none rtl:rounded-bl-none',
                isModern &&
                    divider &&
                    `${
                        !isLastChild ? 'border-b pb-6' : ''
                    } py-4 md:border-gray-200 md:dark:border-gray-600 rounded-br-none rounded-bl-none`,
                !isModern && shadow && 'rounded-none shadow-none border-0',
            )}
            {...rest}
            bodyClass={bodyClass}
        >
            {children}
        </Card>
    )
}

export default AdaptableCard
