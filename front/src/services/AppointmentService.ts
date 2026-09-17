import ApiService from './ApiService'
import type {
    Appointment,
    AppointmentPayload,
    Provider,
    Room,
} from '@/@types/appointment'

export async function apiGetAppointments(
    from: string,
    to: string,
    params?: { providerId?: number; roomId?: number },
) {
    return ApiService.fetchData<Appointment[]>({
        url: '/appointments',
        method: 'get',
        params: { from, to, ...params },
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

export async function apiGetProviders(activeOnly?: boolean) {
    return ApiService.fetchData<Provider[]>({
        url: '/providers',
        method: 'get',
        params: activeOnly == null ? undefined : { activeOnly },
    })
}

export async function apiCreateProvider(data: {
    name: string
    color?: string
    active?: boolean
}) {
    return ApiService.fetchData<Provider>({
        url: '/providers',
        method: 'post',
        data,
    })
}

export async function apiUpdateProvider(
    id: number,
    data: { name: string; color?: string; active?: boolean },
) {
    return ApiService.fetchData<Provider>({
        url: `/providers/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteProvider(id: number) {
    return ApiService.fetchData<void>({
        url: `/providers/${id}`,
        method: 'delete',
    })
}

export async function apiGetRooms(activeOnly?: boolean) {
    return ApiService.fetchData<Room[]>({
        url: '/rooms',
        method: 'get',
        params: activeOnly == null ? undefined : { activeOnly },
    })
}

export async function apiCreateRoom(data: { name: string; active?: boolean }) {
    return ApiService.fetchData<Room>({
        url: '/rooms',
        method: 'post',
        data,
    })
}

export async function apiUpdateRoom(
    id: number,
    data: { name: string; active?: boolean },
) {
    return ApiService.fetchData<Room>({
        url: `/rooms/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteRoom(id: number) {
    return ApiService.fetchData<void>({
        url: `/rooms/${id}`,
        method: 'delete',
    })
}
