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
}
