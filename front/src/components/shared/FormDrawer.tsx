import { useEffect, useState, type ReactNode } from 'react'
import classNames from 'classnames'
import Drawer from '@/components/ui/Drawer'
import { Button } from '@/components/ui'

export type FormDrawerAccent =
    | 'indigo'
    | 'emerald'
    | 'amber'
    | 'violet'
    | 'sky'
    | 'rose'

const accentStyles: Record<
    FormDrawerAccent,
    { header: string; icon: string }
> = {
    indigo: {
        header: 'border-l-4 border-l-indigo-500',
        icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    },
    emerald: {
        header: 'border-l-4 border-l-emerald-500',
        icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    amber: {
        header: 'border-l-4 border-l-amber-500',
        icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    },
    violet: {
        header: 'border-l-4 border-l-violet-500',
        icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    },
    sky: {
        header: 'border-l-4 border-l-sky-500',
        icon: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    },
    rose: {
        header: 'border-l-4 border-l-rose-500',
        icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    },
}

const getDrawerWidth = () => {
    if (typeof window === 'undefined') {
        return 480
    }
    const viewport = window.innerWidth
    return viewport < 768
        ? Math.round(viewport * 0.92)
        : Math.round(viewport * 0.48)
}

type FormDrawerProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: ReactNode
    accent?: FormDrawerAccent
    icon?: ReactNode
    children: ReactNode
    saving?: boolean
    saveLabel?: string
    cancelLabel?: string
    saveDisabled?: boolean
    onSave?: () => void
    footerStart?: ReactNode
    footer?: ReactNode
}

const FormDrawer = ({
    isOpen,
    onClose,
    title,
    subtitle,
    accent = 'indigo',
    icon,
    children,
    saving = false,
    saveLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    saveDisabled = false,
    onSave,
    footerStart,
    footer,
}: FormDrawerProps) => {
    const [width, setWidth] = useState(getDrawerWidth)
    const styles = accentStyles[accent]

    useEffect(() => {
        const onResize = () => setWidth(getDrawerWidth())
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setWidth(getDrawerWidth())
        }
    }, [isOpen])

    const defaultFooter = (
        <>
            <div>{footerStart}</div>
            <div>
                <Button className="mr-2" onClick={onClose}>
                    {cancelLabel}
                </Button>
                {onSave && (
                    <Button
                        variant="solid"
                        loading={saving}
                        disabled={saveDisabled}
                        onClick={onSave}
                    >
                        {saveLabel}
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <Drawer
            className="form-drawer"
            isOpen={isOpen}
            placement="right"
            width={width}
            title={
                <div className="flex items-start gap-3 min-w-0">
                    {icon ? (
                        <span
                            className={classNames(
                                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl',
                                styles.icon,
                            )}
                        >
                            {icon}
                        </span>
                    ) : null}
                    <div className="min-w-0">
                        <h5 className="mb-0.5">{title}</h5>
                        {subtitle ? (
                            <div className="mt-1">{subtitle}</div>
                        ) : null}
                    </div>
                </div>
            }
            headerClass={classNames(styles.header, 'pl-5')}
            bodyClass="pb-2"
            footer={footer ?? (onSave ? defaultFooter : undefined)}
            footerClass="justify-between gap-3"
            onClose={onClose}
            onRequestClose={onClose}
        >
            {children}
        </Drawer>
    )
}

export default FormDrawer
