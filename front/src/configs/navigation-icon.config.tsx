import {
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineHome,
    HiOutlineKey,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <HiOutlineHome />,
    patients: <HiOutlineUserGroup />,
    agenda: <HiOutlineCalendar />,
    treatments: <HiOutlineClipboardList />,
    roles: <HiOutlineKey />,
}

export default navigationIcon
