import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SLICE_BASE_NAME } from './constants'

export type UserState = {
    avatar?: string
    userName?: string
    email?: string
    authority?: string[]
    clinicId?: number | null
}

const initialState: UserState = {
    avatar: '',
    userName: '',
    email: '',
    authority: [],
    clinicId: null,
}

const userSlice = createSlice({
    name: `${SLICE_BASE_NAME}/user`,
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<UserState>) {
            state.avatar = action.payload?.avatar
            state.email = action.payload?.email
            state.userName = action.payload?.userName
            state.authority = action.payload?.authority
            state.clinicId = action.payload?.clinicId ?? null
        },
    },
})

export const { setUser } = userSlice.actions
export default userSlice.reducer
