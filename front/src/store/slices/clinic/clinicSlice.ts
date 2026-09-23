import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
    DEFAULT_CLINIC_FEATURES,
    type ClinicIdentity,
} from '@/@types/clinic'

export type ClinicState = {
    current: ClinicIdentity | null
    list: ClinicIdentity[]
}

const initialState: ClinicState = {
    current: null,
    list: [],
}

const normalizeClinic = (clinic: ClinicIdentity | null): ClinicIdentity | null => {
    if (!clinic) {
        return null
    }
    return {
        ...clinic,
        features: clinic.features ?? DEFAULT_CLINIC_FEATURES,
        reminderHoursBefore: clinic.reminderHoursBefore ?? 24,
        reminderMessageTemplate: clinic.reminderMessageTemplate ?? null,
        reminderDefaultCountryCode: clinic.reminderDefaultCountryCode ?? '503',
    }
}

const clinicSlice = createSlice({
    name: 'clinic',
    initialState,
    reducers: {
        setCurrentClinic(state, action: PayloadAction<ClinicIdentity | null>) {
            state.current = normalizeClinic(action.payload)
        },
        setClinicList(state, action: PayloadAction<ClinicIdentity[]>) {
            state.list = action.payload.map(
                (clinic) => normalizeClinic(clinic) as ClinicIdentity,
            )
        },
    },
})

export const { setCurrentClinic, setClinicList } = clinicSlice.actions
export default clinicSlice.reducer
