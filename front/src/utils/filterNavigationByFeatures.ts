import type { NavigationTree } from '@/@types/navigation'
import type { ClinicFeatures } from '@/@types/clinic'
import { DEFAULT_CLINIC_FEATURES } from '@/@types/clinic'

export function filterNavigationByFeatures(
    tree: NavigationTree[],
    features: ClinicFeatures = DEFAULT_CLINIC_FEATURES,
): NavigationTree[] {
    return tree
        .filter((nav) => {
            if (nav.key === 'referrals' && !features.referralsInboundEnabled) {
                return false
            }
            return true
        })
        .map((nav) => ({
            ...nav,
            subMenu: filterNavigationByFeatures(nav.subMenu || [], features),
        }))
}
