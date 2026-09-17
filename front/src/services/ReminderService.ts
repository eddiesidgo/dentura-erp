import ApiService from './ApiService'
import type { GenerateRemindersResult, Reminder } from '@/@types/reminder'

export async function apiGetReminders(status?: string) {
    return ApiService.fetchData<Reminder[]>({
        url: '/reminders',
        method: 'get',
        params: status ? { status } : undefined,
    })
}

export async function apiGenerateReminders() {
    return ApiService.fetchData<GenerateRemindersResult>({
        url: '/reminders/generate',
        method: 'post',
    })
}

export async function apiMarkReminderSent(id: number | string) {
    return ApiService.fetchData<Reminder>({
        url: `/reminders/${id}/sent`,
        method: 'post',
    })
}

export async function apiMarkReminderSkipped(id: number | string) {
    return ApiService.fetchData<Reminder>({
        url: `/reminders/${id}/skipped`,
        method: 'post',
    })
}
