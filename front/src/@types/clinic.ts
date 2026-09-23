export type ClinicProviderMode = 'SINGLE' | 'MULTI'
export type ClinicRoomMode = 'OFF' | 'OPTIONAL' | 'REQUIRED'
export type ClinicDeliveryPreset = 'BASIC' | 'MULTI_DOCTOR' | 'FULL'

export type ClinicFeatures = {
    providerMode: ClinicProviderMode
    roomMode: ClinicRoomMode
    referralsInboundEnabled: boolean
    referralsOutboundEnabled: boolean
}

export type ClinicIdentity = {
    id: number
    code: string
    name: string
    logoUrl: string | null
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    department: string | null
    nit: string | null
    themeMode: 'light' | 'dark'
    themeColor: string
    primaryColorLevel: number
    navMode: 'transparent' | 'light' | 'dark' | 'themed'
    layoutType: string
    direction: 'ltr' | 'rtl'
    active: boolean
    features: ClinicFeatures
    reminderHoursBefore: number
    reminderMessageTemplate: string | null
    reminderDefaultCountryCode: string
}

export type UpdateClinicIdentityRequest = {
    name: string
    logoUrl?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
    department?: string | null
    nit?: string | null
    themeMode: string
    themeColor: string
    primaryColorLevel: number
    navMode: string
    layoutType: string
    direction: string
    providerMode?: ClinicProviderMode
    roomMode?: ClinicRoomMode
    referralsInboundEnabled?: boolean
    referralsOutboundEnabled?: boolean
    reminderHoursBefore?: number
    reminderMessageTemplate?: string | null
    reminderDefaultCountryCode?: string
}

export const DEFAULT_CLINIC_FEATURES: ClinicFeatures = {
    providerMode: 'MULTI',
    roomMode: 'OPTIONAL',
    referralsInboundEnabled: true,
    referralsOutboundEnabled: true,
}
