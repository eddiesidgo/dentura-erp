import { useNavigate } from 'react-router-dom'
import { HiOutlineUserGroup } from 'react-icons/hi'
import AdaptableCard from '@/components/shared/AdaptableCard'
import Button from '@/components/ui/Button'

const Home = () => {
    const navigate = useNavigate()

    return (
        <AdaptableCard>
            <h4 className="mb-2">Dentura ERP</h4>
            <p className="mb-6">
                Gestión de clínica dental. El primer módulo es el padrón de
                pacientes: ficha, búsqueda y datos fiscales básicos.
            </p>
            <Button
                variant="solid"
                icon={<HiOutlineUserGroup />}
                onClick={() => navigate('/pacientes')}
            >
                Ir a pacientes
            </Button>
        </AdaptableCard>
    )
}

export default Home
