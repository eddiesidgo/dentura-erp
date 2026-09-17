import {
    HiOutlineCalendar,
    HiOutlineCash,
    HiOutlineChatAlt2,
    HiOutlineClipboardCheck,
    HiOutlineClipboardList,
    HiOutlineCollection,
    HiOutlineDocumentDuplicate,
    HiOutlineDocumentText,
    HiOutlineHeart,
    HiOutlineHome,
    HiOutlineKey,
    HiOutlineShare,
    HiOutlineShieldCheck,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <HiOutlineHome />,
    patients: <HiOutlineUserGroup />,
    agenda: <HiOutlineCalendar />,
    reminders: <HiOutlineChatAlt2 />,
    odontogram: <HiOutlineHeart />,
    treatments: <HiOutlineClipboardList />,
    works: <HiOutlineClipboardCheck />,
    medications: <HiOutlineDocumentText />,
    prescriptionTemplates: <HiOutlineDocumentDuplicate />,
    referrals: <HiOutlineShare />,
    roles: <HiOutlineKey />,
    audit: <HiOutlineShieldCheck />,
    reports: <HiOutlineDocumentText />,
    morosos: <HiOutlineCash />,
    inventory: <HiOutlineCollection />,
}

export default navigationIcon
