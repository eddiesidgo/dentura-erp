import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import {
    DEFAULT_CLINIC_FEATURES,
    type ClinicFeatures,
} from '@/@types/clinic'

export default function useClinicFeatures(): ClinicFeatures {
    const features = useAppSelector((state) => state.clinic.current?.features)
    return useMemo(
        () => features ?? DEFAULT_CLINIC_FEATURES,
        [features],
    )
}
