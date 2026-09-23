import { useCallback, useEffect, useState } from 'react'
import AdaptableCard from '@/components/shared/AdaptableCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FormDrawer from '@/components/shared/FormDrawer'
import PageHeader from '@/components/shared/PageHeader'
import TableRowActions from '@/components/shared/TableRowActions'
import {
    Button,
    Checkbox,
    Input,
    Notification,
    Select,
    Switcher,
    Tag,
    toast,
} from '@/components/ui'
import { getApiErrorMessage } from '@/services/PatientService'
import {
    apiAssignUserRoles,
    apiCreateClinicUser,
    apiCreateRole,
    apiDeleteRole,
    apiGetPermissions,
    apiGetRoleUsers,
    apiGetRoles,
    apiUpdateClinicUser,
    apiUpdateRole,
    type ClinicUserRoles,
    type Permission,
    type Role,
} from '@/services/RoleService'
import { HiOutlineKey, HiPlusCircle } from 'react-icons/hi'
import { useAppSelector } from '@/store'

type RoleOption = { label: string; value: number }

type RoleForm = {
    id?: number
    code: string
    name: string
    description: string
    permissionIds: number[]
}

type UserForm = {
    userName: string
    email: string
    password: string
    roleIds: number[]
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

const emptyUserForm: UserForm = {
    userName: '',
    email: '',
    password: '',
    roleIds: [],
}

const RoleList = () => {
    const clinicId = useAppSelector((state) => state.clinic.current?.id)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [users, setUsers] = useState<ClinicUserRoles[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<RoleForm>(emptyForm)
    const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [userDialogOpen, setUserDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [savingUser, setSavingUser] = useState(false)
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

    const toggleActive = async (user: ClinicUserRoles) => {
        try {
            const updated = await apiUpdateClinicUser(user.id, {
                active: !user.active,
                roleIds: user.roleIds,
            })
            setUsers((prev) =>
                prev.map((item) =>
                    item.id === user.id ? updated.data : item,
                ),
            )
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo actualizar">
                    {getApiErrorMessage(error, 'Error al cambiar el estado')}
                </Notification>,
            )
        }
    }

    const saveUser = async () => {
        if (
            !userForm.userName.trim() ||
            !userForm.email.trim() ||
            !userForm.password.trim()
        ) {
            return
        }
        setSavingUser(true)
        try {
            await apiCreateClinicUser({
                userName: userForm.userName.trim(),
                email: userForm.email.trim(),
                password: userForm.password,
                roleIds: userForm.roleIds,
            })
            setUserDialogOpen(false)
            setUserForm(emptyUserForm)
            await load()
        } catch (error) {
            toast.push(
                <Notification type="danger" title="No se pudo crear">
                    {getApiErrorMessage(error, 'Error al crear el usuario')}
                </Notification>,
            )
        } finally {
            setSavingUser(false)
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
            <PageHeader
                title="Roles y permisos"
                subtitle="Administración"
                info="Define qué puede hacer cada rol. El permiso «Asignar roles y permisos» habilita esta pantalla. Solo aplica a esta clínica."
                extra={
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={openCreate}
                    >
                        Nuevo rol
                    </Button>
                }
            />
            <AdaptableCard className="mb-4" bodyClass="p-4 sm:p-5">
                <div className="mb-4">
                    <h3 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Roles de esta clínica
                    </h3>
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
                                        <div className="text-xs opacity-70 flex flex-wrap items-center gap-1.5 mt-0.5">
                                            <span>{role.code}</span>
                                            {role.systemRole ? (
                                                <Tag className="border-0 bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-100 text-xs">
                                                    sistema
                                                </Tag>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {role.permissionIds
                                            .map(permissionName)
                                            .join(', ') || 'Sin permisos'}
                                    </td>
                                    <td className="py-3">
                                        <TableRowActions
                                            editTitle="Editar"
                                            deleteTitle="Eliminar"
                                            onEdit={() => openEdit(role)}
                                            onDelete={
                                                role.systemRole
                                                    ? undefined
                                                    : () => setToDelete(role)
                                            }
                                        />
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

            <AdaptableCard bodyClass="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Usuarios de la clínica
                        </h3>
                        <p className="text-sm">
                            Crea usuarios, asigna roles y desactiva accesos.
                            El usuario debe volver a iniciar sesión para ver
                            menús nuevos.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={() => {
                            setUserForm(emptyUserForm)
                            setUserDialogOpen(true)
                        }}
                    >
                        Nuevo usuario
                    </Button>
                </div>
                <div className="flex flex-col gap-4">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-center"
                        >
                            <div>
                                <div className="font-semibold flex items-center gap-2">
                                    {user.userName}
                                    <Tag
                                        className={
                                            user.active
                                                ? 'border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100'
                                                : 'border-0 bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100'
                                        }
                                    >
                                        {user.active ? 'Activo' : 'Inactivo'}
                                    </Tag>
                                </div>
                                <div className="text-xs opacity-70">{user.email}</div>
                            </div>
                            <div>
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
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs opacity-70">Activo</span>
                                <Switcher
                                    checked={user.active}
                                    onChange={() => toggleActive(user)}
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

            <FormDrawer
                isOpen={dialogOpen}
                accent="violet"
                icon={<HiOutlineKey />}
                title={form.id ? 'Editar rol' : 'Nuevo rol'}
                saving={saving}
                onClose={() => setDialogOpen(false)}
                onSave={saveRole}
            >
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
                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
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
                </div>
            </FormDrawer>

            <FormDrawer
                isOpen={userDialogOpen}
                accent="sky"
                icon={<HiOutlineKey />}
                title="Nuevo usuario"
                saving={savingUser}
                saveDisabled={
                    !userForm.userName.trim() ||
                    !userForm.email.trim() ||
                    userForm.password.length < 6
                }
                onClose={() => setUserDialogOpen(false)}
                onSave={saveUser}
            >
                <div className="flex flex-col gap-3">
                    <Input
                        placeholder="Usuario"
                        value={userForm.userName}
                        onChange={(e) =>
                            setUserForm((prev) => ({
                                ...prev,
                                userName: e.target.value,
                            }))
                        }
                    />
                    <Input
                        placeholder="Correo"
                        value={userForm.email}
                        onChange={(e) =>
                            setUserForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                            }))
                        }
                    />
                    <Input
                        type="password"
                        placeholder="Contraseña (mín. 6)"
                        value={userForm.password}
                        onChange={(e) =>
                            setUserForm((prev) => ({
                                ...prev,
                                password: e.target.value,
                            }))
                        }
                    />
                    <Select<RoleOption, true>
                        isMulti
                        placeholder="Roles"
                        options={roleOptions}
                        value={roleOptions.filter((option) =>
                            userForm.roleIds.includes(option.value),
                        )}
                        onChange={(opts) =>
                            setUserForm((prev) => ({
                                ...prev,
                                roleIds: (opts || []).map((option) => option.value),
                            }))
                        }
                    />
                </div>
            </FormDrawer>

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
