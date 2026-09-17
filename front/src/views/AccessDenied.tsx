import { Link } from 'react-router-dom'
import AdaptableCard from '@/components/shared/AdaptableCard'
import { Button } from '@/components/ui'
import { HiOutlineLockClosed } from 'react-icons/hi'

const AccessDenied = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <AdaptableCard className="max-w-lg w-full" bodyClass="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
                    <HiOutlineLockClosed className="text-2xl" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Acceso denegado
                </h3>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    No tienes permiso para ver esta sección. Si crees que es un
                    error, pide a un administrador que revise tus roles.
                </p>
                <Link to="/home">
                    <Button variant="solid">Volver al inicio</Button>
                </Link>
            </AdaptableCard>
        </div>
    )
}

export default AccessDenied
