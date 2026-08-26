import { lazy } from 'react'
import authRoute from './authRoute'
import {
    PATIENTS_READ,
    PATIENTS_WRITE,
    ROLES_MANAGE,
} from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
        meta: {
            header: 'Inicio',
        },
    },
    {
        key: 'patients',
        path: '/pacientes',
        component: lazy(() => import('@/views/patients/PatientList')),
        authority: [PATIENTS_READ],
        meta: {
            header: 'Pacientes',
        },
    },
    {
        key: 'patients.new',
        path: '/pacientes/nuevo',
        component: lazy(() => import('@/views/patients/PatientForm')),
        authority: [PATIENTS_WRITE],
        meta: {
            header: 'Nuevo paciente',
            footer: false,
        },
    },
    {
        key: 'patients.edit',
        path: '/pacientes/:patientId',
        component: lazy(() => import('@/views/patients/PatientForm')),
        authority: [PATIENTS_WRITE],
        meta: {
            header: 'Ficha de paciente',
            footer: false,
        },
    },
    {
        key: 'roles',
        path: '/roles',
        component: lazy(() => import('@/views/roles/RoleList')),
        authority: [ROLES_MANAGE],
        meta: {
            header: 'Roles y permisos',
        },
    },
]
