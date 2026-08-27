import { useNavigate } from 'react-router-dom'
import {
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineUserGroup,
} from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import Button from '@/components/ui/Button'
import useThemeClass from '@/utils/hooks/useThemeClass'

const Home = () => {
    const navigate = useNavigate()
    const { pageTitleTheme } = useThemeClass()

    return (
        <AdaptableCard>
            <h4 className={`mb-2 ${pageTitleTheme}`}>Dentura ERP</h4>
            <p className="mb-6">
                Pacientes, agenda y catálogo de tratamientos, con roles y datos
                separados por clínica.
            </p>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="solid"
                    icon={<HiOutlineUserGroup />}
                    onClick={() => navigate('/pacientes')}
                >
                    Pacientes
                </Button>
                <Button
                    variant="twoTone"
                    icon={<HiOutlineCalendar />}
                    onClick={() => navigate('/agenda')}
                >
                    Agenda
                </Button>
                <Button
                    variant="twoTone"
                    icon={<HiOutlineClipboardList />}
                    onClick={() => navigate('/tratamientos')}
                >
                    Tratamientos
                </Button>
            </div>
        </AdaptableCard>
    )
}

export default Home
