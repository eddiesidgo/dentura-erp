import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ClinicIdentity } from '@/@types/clinic'

export type ClinicState = {
    current: ClinicIdentity | null
    list: ClinicIdentity[]
}

const initialState: ClinicState = {
    current: null,
    list: [],
}

const clinicSlice = createSlice({
    name: 'clinic',
    initialState,
    reducers: {
        setCurrentClinic(state, action: PayloadAction<ClinicIdentity | null>) {
            state.current = action.payload
        },
        setClinicList(state, action: PayloadAction<ClinicIdentity[]>) {
            state.list = action.payload
        },
    },
})

export const { setCurrentClinic, setClinicList } = clinicSlice.actions
export default clinicSlice.reducer
