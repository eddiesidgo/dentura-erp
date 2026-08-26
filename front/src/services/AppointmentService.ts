import ApiService from './ApiService'
import type { Appointment, AppointmentPayload } from '@/@types/appointment'

export async function apiGetAppointments(from: string, to: string) {
    return ApiService.fetchData<Appointment[]>({
        url: '/appointments',
        method: 'get',
        params: { from, to },
    })
}

export async function apiCreateAppointment(data: AppointmentPayload) {
    return ApiService.fetchData<Appointment>({
        url: '/appointments',
        method: 'post',
        data,
    })
}

export async function apiUpdateAppointment(
    id: number | string,
    data: AppointmentPayload,
) {
    return ApiService.fetchData<Appointment>({
        url: `/appointments/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteAppointment(id: number | string) {
    return ApiService.fetchData<void>({
        url: `/appointments/${id}`,
        method: 'delete',
    })
}
