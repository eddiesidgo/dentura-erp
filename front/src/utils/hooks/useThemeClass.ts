import { useConfig } from '@/components/ui/ConfigProvider'
import { MODE_DARK, NAV_MODE_DARK, NAV_MODE_THEMED } from '@/constants/theme.constant'
import { useAppSelector } from '@/store'

const PALE_HUES = new Set(['yellow', 'lime', 'amber'])

function useThemeClass() {
    const { themeColor, primaryColorLevel } = useConfig()
    const color = `${themeColor}-${primaryColorLevel}`
    const mode = useAppSelector((state) => state.theme.mode)
    const navMode = useAppSelector((state) => state.theme.navMode)
    const level = Number(primaryColorLevel) || 600

    const onThemedNav = navMode === NAV_MODE_THEMED
    const onDarkNav =
        navMode === NAV_MODE_DARK ||
        (navMode !== NAV_MODE_THEMED && mode === MODE_DARK)

    const pale = PALE_HUES.has(themeColor)
    const lightPageTitle = pale
        ? `text-${themeColor}-800`
        : `text-${themeColor}-700`
    const darkPageTitle = `text-${themeColor}-300`
    const pageTitleTheme = mode === MODE_DARK ? darkPageTitle : lightPageTitle

    let navTitleTheme = pageTitleTheme
    if (onThemedNav) {
        navTitleTheme = pale || level < 500 ? 'text-gray-900' : 'text-white'
    } else if (onDarkNav) {
        navTitleTheme = darkPageTitle
    }

    return {
        ringTheme: `ring-${color}`,
        borderTheme: `border-${color}`,
        bgTheme: `bg-${color}`,
        textTheme: `text-${color}`,
        pageTitleTheme,
        navTitleTheme,
    }
}

export default useThemeClass
