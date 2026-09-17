import { useEffect, useMemo, useRef } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import { PATIENTS_WRITE } from '@/constants/roles.constant'
import { useAppSelector } from '@/store'
import { HiOutlineSearch, HiPlusCircle } from 'react-icons/hi'
import debounce from 'lodash/debounce'

type PatientTableToolsProps = {
    onSearch: (value: string) => void
    onCreate: () => void
    canCreate?: boolean
}

const PatientTableTools = ({
    onSearch,
    onCreate,
    canCreate = false,
}: PatientTableToolsProps) => {
    const userAuthority =
        useAppSelector((state) => state.auth.user.authority) || []
    const onSearchRef = useRef(onSearch)
    onSearchRef.current = onSearch

    const debounceSearch = useMemo(
        () =>
            debounce((value: string) => {
                onSearchRef.current(value)
            }, 400),
        [],
    )

    useEffect(() => {
        return () => debounceSearch.cancel()
    }, [debounceSearch])

    return (
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Input
                className="lg:w-72"
                size="sm"
                placeholder="Buscar por nombre, expediente, DUI..."
                prefix={<HiOutlineSearch className="text-lg" />}
                onChange={(e) => debounceSearch(e.target.value)}
            />
            <AuthorityCheck
                userAuthority={userAuthority}
                authority={[PATIENTS_WRITE]}
            >
                {canCreate ? (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={onCreate}
                    >
                        Nuevo paciente
                    </Button>
                ) : null}
            </AuthorityCheck>
        </div>
    )
}

export default PatientTableTools
