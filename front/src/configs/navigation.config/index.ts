import {
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { PATIENTS_READ, ROLES_MANAGE } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'Inicio',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'patients',
        path: '/pacientes',
        title: 'Pacientes',
        translateKey: 'nav.patients',
        icon: 'patients',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [PATIENTS_READ],
        subMenu: [],
    },
    {
        key: 'roles',
        path: '/roles',
        title: 'Roles y permisos',
        translateKey: 'nav.roles',
        icon: 'roles',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ROLES_MANAGE],
        subMenu: [],
    },
]

export default navigationConfig
