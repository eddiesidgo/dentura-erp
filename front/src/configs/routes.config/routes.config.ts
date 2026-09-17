import { lazy } from 'react'
import authRoute from './authRoute'
import {
    AGENDA_READ,
    AUDIT_READ,
    CATALOG_READ,
    ODONTOGRAM_READ,
    PATIENTS_READ,
    PATIENTS_WRITE,
    PRESCRIPTIONS_READ,
    PAYMENTS_READ,
    REFERRALS_READ,
    REPORTS_READ,
    ROLES_MANAGE,
    WORKS_READ,
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
            header: '',
        },
    },
    {
        key: 'accessDenied',
        path: '/access-denied',
        component: lazy(() => import('@/views/AccessDenied')),
        authority: [],
        meta: {
            header: '',
        },
    },
    {
        key: 'patients',
        path: '/pacientes',
        component: lazy(() => import('@/views/patients/PatientList')),
        authority: [PATIENTS_READ],
        meta: {
            header: '',
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
        authority: [PATIENTS_READ],
        meta: {
            header: 'Ficha de paciente',
            footer: false,
        },
    },
    {
        key: 'agenda',
        path: '/agenda',
        component: lazy(() => import('@/views/agenda/AgendaCalendar')),
        authority: [AGENDA_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'reminders',
        path: '/recordatorios',
        component: lazy(() => import('@/views/reminders/ReminderList')),
        authority: [AGENDA_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'odontogram',
        path: '/odontograma',
        component: lazy(() => import('@/views/odontogram')),
        authority: [ODONTOGRAM_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'odontogram',
        path: '/odontograma/:patientId',
        component: lazy(() => import('@/views/odontogram')),
        authority: [ODONTOGRAM_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'treatments',
        path: '/tratamientos',
        component: lazy(() => import('@/views/treatments/TreatmentList')),
        authority: [CATALOG_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'works',
        path: '/trabajos',
        component: lazy(() => import('@/views/works/WorkList')),
        authority: [WORKS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'medications',
        path: '/medicamentos',
        component: lazy(() => import('@/views/medications/MedicationList')),
        authority: [PRESCRIPTIONS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'prescriptionTemplates',
        path: '/plantillas-receta',
        component: lazy(
            () => import('@/views/prescriptions/PrescriptionTemplateList'),
        ),
        authority: [PRESCRIPTIONS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'referrals',
        path: '/referencias',
        component: lazy(
            () => import('@/views/referrals/ReferralSourceList'),
        ),
        authority: [REFERRALS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'roles',
        path: '/roles',
        component: lazy(() => import('@/views/roles/RoleList')),
        authority: [ROLES_MANAGE],
        meta: {
            header: '',
        },
    },
    {
        key: 'audit',
        path: '/auditoria',
        component: lazy(() => import('@/views/audit/AuditList')),
        authority: [AUDIT_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'reports',
        path: '/reportes',
        component: lazy(() => import('@/views/reports/ReportList')),
        authority: [REPORTS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'morosos',
        path: '/morosos',
        component: lazy(() => import('@/views/ledger/MorososList')),
        authority: [PAYMENTS_READ],
        meta: {
            header: '',
        },
    },
    {
        key: 'inventory',
        path: '/inventario',
        component: lazy(() => import('@/views/inventory/InventoryList')),
        authority: [CATALOG_READ],
        meta: {
            header: '',
        },
    },
]
