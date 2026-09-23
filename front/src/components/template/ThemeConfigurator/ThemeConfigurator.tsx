import ModeSwitcher from './ModeSwitcher'
import LayoutSwitcher from './LayoutSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import DirectionSwitcher from './DirectionSwitcher'
import NavModeSwitcher from './NavModeSwitcher'
import IdentityFields from './IdentityFields'
import CreateClinicFields from './CreateClinicFields'
import OperationalSettingsFields from './OperationalSettingsFields'
import SaveIdentityButton from './SaveIdentityButton'
import useThemeClass from '@/utils/hooks/useThemeClass'

export type ThemeConfiguratorProps = {
    callBackClose?: () => void
}

const ThemeConfigurator = ({ callBackClose }: ThemeConfiguratorProps) => {
    const { pageTitleTheme } = useThemeClass()

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col gap-y-10 mb-6">
                <IdentityFields />
                <OperationalSettingsFields />
                <CreateClinicFields />
                <div className="flex items-center justify-between">
                    <div>
                        <h6 className={pageTitleTheme}>Dark Mode</h6>
                        <span>Switch theme to dark mode</span>
                    </div>
                    <ModeSwitcher />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h6 className={pageTitleTheme}>Direction</h6>
                        <span>Select a direction</span>
                    </div>
                    <DirectionSwitcher callBackClose={callBackClose} />
                </div>
                <div>
                    <h6 className={`mb-3 ${pageTitleTheme}`}>Nav Mode</h6>
                    <NavModeSwitcher />
                </div>
                <div>
                    <h6 className={`mb-3 ${pageTitleTheme}`}>Theme</h6>
                    <ThemeSwitcher />
                </div>
                <div>
                    <h6 className={`mb-3 ${pageTitleTheme}`}>Layout</h6>
                    <LayoutSwitcher />
                </div>
            </div>
            <SaveIdentityButton />
        </div>
    )
}

export default ThemeConfigurator
