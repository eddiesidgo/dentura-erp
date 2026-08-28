import classNames from 'classnames'
import Modal from 'react-modal'
import CloseButton from '../CloseButton'
import { motion } from 'framer-motion'
import type ReactModal from 'react-modal'
import type { MouseEvent, ReactNode } from 'react'

export interface DrawerProps extends ReactModal.Props {
    bodyClass?: string
    closable?: boolean
    footer?: string | ReactNode
    footerClass?: string
    headerClass?: string
    height?: string | number
    lockScroll?: boolean
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    placement?: 'top' | 'right' | 'bottom' | 'left'
    showBackdrop?: boolean
    title?: string | ReactNode
    width?: string | number
}

const Drawer = (props: DrawerProps) => {
    const {
        bodyOpenClassName,
        bodyClass,
        children,
        className,
        closable = true,
        closeTimeoutMS = 300,
        footer,
        footerClass,
        headerClass,
        height = 400,
        isOpen,
        lockScroll = true,
        onClose,
        overlayClassName,
        placement = 'right',
        portalClassName,
        showBackdrop = true,
        title,
        width = 400,
        ...rest
    } = props

    const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
        onClose?.(e)
    }

    const renderCloseButton = <CloseButton onClick={onCloseClick} />

    const getStyle = (): {
        dimensionClass?: string
        contentStyle?: {
            width?: string | number
            height?: string | number
        }
        motionStyle: {
            [x: string]: string
        }
    } => {
        if (placement === 'left' || placement === 'right') {
            return {
                dimensionClass: 'vertical',
                contentStyle: { width },
                motionStyle: {
                    [placement]: `-${width}${
                        typeof width === 'number' && 'px'
                    }`,
                },
            }
        }

        if (placement === 'top' || placement === 'bottom') {
            return {
                dimensionClass: 'horizontal',
                contentStyle: { height },
                motionStyle: {
                    [placement]: `-${height}${
                        typeof height === 'number' && 'px'
                    }`,
                },
            }
        }

        return {
            motionStyle: {},
        }
    }

    const { dimensionClass, contentStyle, motionStyle } = getStyle()

    const anchorStyle =
        placement === 'right'
            ? { top: 0, left: 'auto' as const }
            : placement === 'left'
              ? { top: 0, right: 'auto' as const }
              : placement === 'top'
                ? { left: 0, bottom: 'auto' as const }
                : placement === 'bottom'
                  ? { left: 0, top: 'auto' as const }
                  : {}

    const motionTransition = {
        type: 'tween' as const,
        duration: closeTimeoutMS / 1000,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    }

    return (
        <Modal
            className={{
                base: classNames('drawer', className as string),
                afterOpen: 'drawer-after-open',
                beforeClose: 'drawer-before-close',
            }}
            overlayClassName={{
                base: classNames(
                    'drawer-overlay',
                    overlayClassName as string,
                    !showBackdrop && 'bg-transparent',
                ),
                afterOpen: 'drawer-overlay-after-open',
                beforeClose: 'drawer-overlay-before-close',
            }}
            portalClassName={classNames('drawer-portal', portalClassName)}
            bodyOpenClassName={classNames(
                'drawer-open',
                lockScroll && 'drawer-lock-scroll',
                bodyOpenClassName,
            )}
            style={{
                content: {
                    position: 'fixed',
                    inset: 0,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    overflow: 'hidden',
                },
            }}
            ariaHideApp={false}
            isOpen={isOpen}
            closeTimeoutMS={closeTimeoutMS}
            {...rest}
        >
            <motion.div
                className={classNames('drawer-content', dimensionClass)}
                style={{ ...contentStyle, ...anchorStyle }}
                initial={motionStyle}
                animate={{
                    [placement as 'top' | 'right' | 'bottom' | 'left']: isOpen
                        ? 0
                        : motionStyle[placement],
                }}
                transition={motionTransition}
            >
                {title || closable ? (
                    <div className={classNames('drawer-header', headerClass)}>
                        {typeof title === 'string' ? (
                            <h4>{title}</h4>
                        ) : (
                            <span>{title}</span>
                        )}
                        {closable && renderCloseButton}
                    </div>
                ) : null}
                <div className={classNames('drawer-body', bodyClass)}>
                    {children}
                </div>
                {footer && (
                    <div className={classNames('drawer-footer', footerClass)}>
                        {footer}
                    </div>
                )}
            </motion.div>
        </Modal>
    )
}

Drawer.displayName = 'Drawer'

export default Drawer
