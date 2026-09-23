import classNames from 'classnames'
import Button from '@/components/ui/Button'
import type { ButtonProps } from '@/components/ui/Button'

export type GhostButtonProps = ButtonProps

/**
 * Mirror of Button: outlined soft secondary action (analytics SaaS style).
 */
const GhostButton = ({
    className,
    variant = 'default',
    shape = 'round',
    ...rest
}: GhostButtonProps) => (
    <Button
        variant={variant}
        shape={shape}
        className={classNames(
            '!border-gray-200 !bg-white !text-gray-700 !font-medium',
            'hover:!bg-gray-50 hover:!border-gray-300',
            'dark:!bg-transparent dark:!border-gray-600 dark:!text-gray-200',
            'dark:hover:!bg-gray-700/50',
            className,
        )}
        {...rest}
    />
)

export default GhostButton
