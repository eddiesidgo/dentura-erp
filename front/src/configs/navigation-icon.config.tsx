import {
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineDocumentText,
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
    reports: <HiOutlineDocumentText />,
}

export default navigationIcon
