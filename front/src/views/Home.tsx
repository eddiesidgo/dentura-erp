import { useNavigate } from 'react-router-dom'
import { HiOutlineCalendar, HiOutlineUserGroup } from 'react-icons/hi'
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
                Pacientes y agenda de la clínica, con roles y datos separados
                por tenant.
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
            </div>
        </AdaptableCard>
    )
}

export default Home
