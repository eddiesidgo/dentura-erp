import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import { useAppSelector } from '@/store'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 'auto',
    } = props

    const clinic = useAppSelector((state) => state.clinic.current)
    const alt = clinic?.name || APP_NAME
    const customLogo = clinic?.logoUrl

    return (
        <div
            className={classNames('logo flex items-center gap-2', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
            }}
        >
            {customLogo ? (
                <img className={imgClass} src={customLogo} alt={`${alt} logo`} />
            ) : (
                <img
                    className={imgClass}
                    src={`${LOGO_SRC_PATH}logo-${mode}-${type}.png`}
                    alt={`${alt} logo`}
                />
            )}
            {type === 'full' && clinic?.name && (
                <span className="font-semibold truncate max-w-[140px]">
                    {clinic.name}
                </span>
            )}
        </div>
    )
}

export default Logo
