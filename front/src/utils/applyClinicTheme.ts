import type { Dispatch } from '@reduxjs/toolkit'
import {
    setDirection,
    setLayout,
    setMode,
    setNavMode,
    setThemeColor,
    setThemeColorLevel,
} from '@/store/slices/theme/themeSlice'
import type { ClinicIdentity } from '@/@types/clinic'
import type { ColorLevel, Direction, LayoutType, Mode, NavMode } from '@/@types/theme'

export function applyClinicTheme(dispatch: Dispatch, clinic: ClinicIdentity) {
    dispatch(setLayout(clinic.layoutType as LayoutType))
    dispatch(setMode(clinic.themeMode as Mode))
    dispatch(setNavMode(clinic.navMode as NavMode))
    dispatch(setThemeColor(clinic.themeColor))
    dispatch(setThemeColorLevel(clinic.primaryColorLevel as ColorLevel))
    dispatch(setDirection(clinic.direction as Direction))
}
