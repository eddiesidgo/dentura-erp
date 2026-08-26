import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useAuth from '@/utils/hooks/useAuth'
import { useAppSelector } from '@/store'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { HiOutlineLogout, HiOutlineUser } from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'
import type { JSX } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

const dropdownItemList: DropdownList[] = []

const UserDropdownInner = ({ className }: CommonProps) => {
    const { signOut } = useAuth()
    const user = useAppSelector((state) => state.auth.user)
    const clinicName = useAppSelector((state) => state.clinic.current?.name)
    const displayName = user.userName || 'Usuario'
    const roleLabel = user.authority?.[0] || ''

    const UserAvatar = (
        <div className={classNames(className, 'flex items-center gap-2')}>
            <Avatar size={32} shape="circle" src={user.avatar} icon={<HiOutlineUser />} />
            <div className="hidden md:block">
                <div className="text-xs capitalize">{roleLabel}</div>
                <div className="font-bold">{displayName}</div>
            </div>
        </div>
    )

    return (
        <div>
            <Dropdown
                menuStyle={{ minWidth: 240 }}
                renderTitle={UserAvatar}
                placement="bottom-end"
            >
                <Dropdown.Item variant="header">
                    <div className="py-2 px-3 flex items-center gap-2">
                        <Avatar shape="circle" src={user.avatar} icon={<HiOutlineUser />} />
                        <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                                {displayName}
                            </div>
                            <div className="text-xs">{user.email}</div>
                            {clinicName && (
                                <div className="text-xs mt-1">{clinicName}</div>
                            )}
                        </div>
                    </div>
                </Dropdown.Item>
                <Dropdown.Item variant="divider" />
                {dropdownItemList.map((item) => (
                    <Dropdown.Item
                        key={item.label}
                        eventKey={item.label}
                        className="mb-1 px-0"
                    >
                        <Link
                            className="flex h-full w-full px-2"
                            to={item.path}
                        >
                            <span className="flex gap-2 items-center w-full">
                                <span className="text-xl opacity-50">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </span>
                        </Link>
                    </Dropdown.Item>
                ))}
                <Dropdown.Item
                    eventKey="Sign Out"
                    className="gap-2"
                    onClick={signOut}
                >
                    <span className="text-xl opacity-50">
                        <HiOutlineLogout />
                    </span>
                    <span>Sign Out</span>
                </Dropdown.Item>
            </Dropdown>
        </div>
    )
}

const UserDropdown = withHeaderItem(UserDropdownInner)

export default UserDropdown
