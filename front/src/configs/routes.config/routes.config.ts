import { lazy } from 'react'
import authRoute from './authRoute'
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
        authority: [],
        meta: {
            header: 'Pacientes',
        },
    },
    {
        key: 'patients.new',
        path: '/pacientes/nuevo',
        component: lazy(() => import('@/views/patients/PatientForm')),
        authority: [],
        meta: {
            header: 'Nuevo paciente',
            footer: false,
        },
    },
    {
        key: 'patients.edit',
        path: '/pacientes/:patientId',
        component: lazy(() => import('@/views/patients/PatientForm')),
        authority: [],
        meta: {
            header: 'Ficha de paciente',
            footer: false,
        },
    },
]
