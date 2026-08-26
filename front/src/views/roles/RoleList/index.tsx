import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    Button,
    Checkbox,
    Dialog,
    Input,
    Notification,
    Select,
    toast,
} from '@/components/ui'
import useThemeClass from '@/utils/hooks/useThemeClass'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiAssignUserRoles,
    apiCreateRole,
    apiDeleteRole,
    apiGetPermissions,
    apiGetRoleUsers,
    apiGetRoles,
    apiUpdateRole,
    type ClinicUserRoles,
    type Permission,
    type Role,
} from '@/services/RoleService'
import { HiOutlinePencil, HiOutlineTrash, HiPlusCircle } from 'react-icons/hi'
import { useAppSelector } from '@/store'

type RoleOption = { label: string; value: number }

type RoleForm = {
    id?: number
    code: string
    name: string
    description: string
    permissionIds: number[]
}

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .slice(0, 80)

const emptyForm: RoleForm = {
    code: '',
    name: '',
    description: '',
    permissionIds: [],
}

const RoleList = () => {
    const { pageTitleTheme } = useThemeClass()
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [users, setUsers] = useState<ClinicUserRoles[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<RoleForm>(emptyForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toDelete, setToDelete] = useState<Role | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [permRes, roleRes, userRes] = await Promise.all([
                apiGetPermissions(),
                apiGetRoles(),
                apiGetRoleUsers(),
            ])
            setPermissions(permRes.data)
            setRoles(roleRes.data)
            setUsers(userRes.data)
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo cargar">
                    {getApiErrorMessage(error, 'Error al cargar roles')}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load, clinicId])

    const openCreate = () => {
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (role: Role) => {
        setForm({
            id: role.id,
            code: role.code,
            name: role.name,
            description: role.description || '',
            permissionIds: role.permissionIds,
        })
        setDialogOpen(true)
    }

    const saveRole = async () => {
        if (!form.name.trim()) {
            return
        }
        const code = slugify(form.id ? form.code : form.code || form.name)
        if (!code) {
            return
        }
        setSaving(true)
        try {
            const payload = {
                code,
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                permissionIds: form.permissionIds.map(Number),
            }
            if (form.id) {
                await apiUpdateRole(form.id, payload)
            } else {
                await apiCreateRole(payload)
            }
            setDialogOpen(false)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo guardar">
                    {getApiErrorMessage(error, 'Error al guardar el rol')}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!toDelete) {
            return
        }
        try {
            await apiDeleteRole(toDelete.id)
            setToDelete(null)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo eliminar">
                    {getApiErrorMessage(error, 'Error al eliminar el rol')}
                </Notification>,
            )
        }
    }

    const assignRoles = async (userId: number, roleIds: number[]) => {
        try {
            await apiAssignUserRoles(userId, roleIds)
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, roleIds } : user,
                ),
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo asignar">
                    {getApiErrorMessage(error, 'Error al asignar roles')}
                </Notification>,
            )
        }
    }

    const roleOptions: RoleOption[] = roles.map((role) => ({
        label: role.name,
        value: role.id,
    }))

    const permissionName = (id: number) =>
        permissions.find((permission) => permission.id === id)?.name || `#${id}`

    return (
        <>
            <AdaptableCard className="mb-4">
                <div className="lg:flex items-center justify-between mb-4">
                    <div>
                        <h5 className={pageTitleTheme}>Roles de esta clínica</h5>
                        <p className="text-sm">
                            Define qué puede hacer cada rol. El permiso
                            «Asignar roles y permisos» habilita esta pantalla.
                            Solo aplica a esta clínica.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={openCreate}
                    >
                        Nuevo rol
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-gray-200 dark:border-gray-600">
                                <th className="py-2 pr-4">Rol</th>
                                <th className="py-2 pr-4">Permisos</th>
                                <th className="py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr
                                    key={role.id}
                                    className="border-b border-gray-100 dark:border-gray-700"
                                >
                                    <td className="py-3 pr-4">
                                        <div className="font-semibold">
                                            {role.name}
                                        </div>
                                        <div className="text-xs opacity-70">
                                            {role.code}
                                            {role.systemRole ? ' · sistema' : ''}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {role.permissionIds
                                            .map(permissionName)
                                            .join(', ') || 'Sin permisos'}
                                    </td>
                                    <td className="py-3 flex gap-2">
                                        <Button
                                            size="sm"
                                            icon={<HiOutlinePencil />}
                                            onClick={() => openEdit(role)}
                                        />
                                        {!role.systemRole && (
                                            <Button
                                                size="sm"
                                                icon={<HiOutlineTrash />}
                                                onClick={() => setToDelete(role)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && roles.length === 0 && (
                                <tr>
                                    <td className="py-6 opacity-70" colSpan={3}>
                                        No hay roles en esta clínica.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </AdaptableCard>

            <AdaptableCard>
                <h5 className={`mb-2 ${pageTitleTheme}`}>
                    Usuarios de la clínica
                </h5>
                <p className="text-sm mb-4">
                    Asigna uno o varios roles. Solo usuarios de esta clínica.
                    El usuario debe volver a iniciar sesión para ver menús
                    nuevos.
                </p>
                <div className="flex flex-col gap-4">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="grid md:grid-cols-3 gap-3 items-center"
                        >
                            <div>
                                <div className="font-semibold">{user.userName}</div>
                                <div className="text-xs opacity-70">{user.email}</div>
                            </div>
                            <div className="md:col-span-2">
                                <Select<RoleOption, true>
                                    isMulti
                                    size="sm"
                                    placeholder="Roles"
                                    options={roleOptions}
                                    value={roleOptions.filter((option) =>
                                        user.roleIds.includes(option.value),
                                    )}
                                    onChange={(opts) =>
                                        assignRoles(
                                            user.id,
                                            (opts || []).map((option) => option.value),
                                        )
                                    }
                                />
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <p className="text-sm opacity-70">
                            No hay usuarios asignados a esta clínica.
                        </p>
                    )}
                </div>
            </AdaptableCard>

            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <h5 className="mb-4">{form.id ? 'Editar rol' : 'Nuevo rol'}</h5>
                <div className="flex flex-col gap-3">
                    <Input
                        placeholder="código (ej. caja)"
                        value={form.code}
                        disabled={Boolean(form.id)}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, code: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Nombre"
                        value={form.name}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Descripción"
                        value={form.description}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                    />
                    <div>
                        <div className="font-semibold mb-2">Permisos</div>
                        <Checkbox.Group
                            vertical
                            value={form.permissionIds}
                            onChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    permissionIds: (value as (number | string)[]).map(
                                        Number,
                                    ),
                                }))
                            }
                        >
                            {permissions.map((permission) => (
                                <Checkbox
                                    key={permission.id}
                                    value={permission.id}
                                >
                                    <span className="font-medium">
                                        {permission.name}
                                    </span>
                                    <span className="block text-xs opacity-70">
                                        {permission.code}
                                        {permission.description
                                            ? ` · ${permission.description}`
                                            : ''}
                                    </span>
                                </Checkbox>
                            ))}
                        </Checkbox.Group>
                    </div>
                    <div className="text-right mt-2">
                        <Button
                            className="mr-2"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={saving}
                            onClick={saveRole}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(toDelete)}
                type="danger"
                title="Eliminar rol"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={() => setToDelete(null)}
                onRequestClose={() => setToDelete(null)}
                onCancel={() => setToDelete(null)}
                onConfirm={confirmDelete}
            >
                <p>
                    ¿Eliminar el rol{' '}
                    <span className="font-semibold">{toDelete?.name}</span>?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default RoleList
