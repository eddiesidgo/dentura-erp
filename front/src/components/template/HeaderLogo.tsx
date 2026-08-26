import Logo from '@/components/template/Logo'
import { useAppSelector } from '@/store'
import useThemeClass from '@/utils/hooks/useThemeClass'

const HeaderLogo = () => {
    const mode = useAppSelector((state) => state.theme.mode)
    const { pageTitleTheme } = useThemeClass()

    return (
        <Logo
            mode={mode}
            titleClassName={pageTitleTheme}
            className="hidden md:block"
        />
    )
}

export default HeaderLogo
