import {
    HiOutlineCalendar,
    HiOutlineClipboardCheck,
    HiOutlineClipboardList,
    HiOutlineDocumentText,
    HiOutlineHome,
    HiOutlineKey,
    HiOutlineShare,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <HiOutlineHome />,
    patients: <HiOutlineUserGroup />,
    agenda: <HiOutlineCalendar />,
    treatments: <HiOutlineClipboardList />,
    works: <HiOutlineClipboardCheck />,
    medications: <HiOutlineDocumentText />,
    referrals: <HiOutlineShare />,
    roles: <HiOutlineKey />,
    reports: <HiOutlineDocumentText />,
}

export default navigationIcon
