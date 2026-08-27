import classNames from 'classnames'
import Tooltip from '@/components/ui/Tooltip'
import useThemeClass from '@/utils/hooks/useThemeClass'
import {
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi'

type TableRowActionsProps = {
    onView?: () => void
    onEdit?: () => void
    onDelete?: () => void
    viewTitle?: string
    editTitle?: string
    deleteTitle?: string
    className?: string
}

/**
 * Icon actions for list tables (Elstar Product/Customer list pattern).
 * Prefer visible icons over ellipsis menus.
 */
const TableRowActions = ({
    onView,
    onEdit,
    onDelete,
    viewTitle = 'Ver',
    editTitle = 'Editar',
    deleteTitle = 'Eliminar',
    className,
}: TableRowActionsProps) => {
    const { textTheme } = useThemeClass()

    if (!onView && !onEdit && !onDelete) {
        return null
    }

    return (
        <div
            className={classNames(
                'flex items-center justify-end gap-2 text-lg',
                className,
            )}
        >
            {onView && (
                <Tooltip title={viewTitle}>
                    <span
                        role="button"
                        tabIndex={0}
                        className={classNames(
                            'cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                            textTheme,
                        )}
                        onClick={onView}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onView()
                            }
                        }}
                    >
                        <HiOutlineEye />
                    </span>
                </Tooltip>
            )}
            {onEdit && (
                <Tooltip title={editTitle}>
                    <span
                        role="button"
                        tabIndex={0}
                        className={classNames(
                            'cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                            textTheme,
                        )}
                        onClick={onEdit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onEdit()
                            }
                        }}
                    >
                        <HiOutlinePencil />
                    </span>
                </Tooltip>
            )}
            {onDelete && (
                <Tooltip title={deleteTitle}>
                    <span
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={onDelete}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onDelete()
                            }
                        }}
                    >
                        <HiOutlineTrash />
                    </span>
                </Tooltip>
            )}
        </div>
    )
}

export default TableRowActions
