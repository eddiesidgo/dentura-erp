import ClinicSwitcher from './ClinicSwitcher'
import SidePanel from './SidePanel'
import UserDropdown from './UserDropdown'

const HeaderTools = () => {
    return (
        <>
            <ClinicSwitcher />
            <SidePanel />
            <UserDropdown hoverable={false} />
        </>
    )
}

export default HeaderTools
