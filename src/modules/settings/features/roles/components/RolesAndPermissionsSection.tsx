import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { can } from '@/shared/lib/permissions';
import {
  listAllPermissions,
  listCompanyUsersWithRoles,
  listRolesForCompany,
} from '../actions.server';
import { RolesList } from './RolesList';
import { UserRolesAssignment } from './UserRolesAssignment';

export default async function RolesAndPermissionsSection() {
  const [canView, canCreate, canUpdate, canDelete, canAssign] = await Promise.all([
    can('roles.view'),
    can('roles.create'),
    can('roles.update'),
    can('roles.delete'),
    can('roles.assign'),
  ]);

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No tenés permisos para ver esta sección.
        </CardContent>
      </Card>
    );
  }

  const [roles, permissions, users] = await Promise.all([
    listRolesForCompany(),
    listAllPermissions(),
    canAssign ? listCompanyUsersWithRoles() : Promise.resolve([]),
  ]);

  return (
    <Tabs defaultValue="roles" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="assignment" disabled={!canAssign}>
          Asignación
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        <Card>
          <CardHeader>
            <CardTitle>Roles y permisos</CardTitle>
            <CardDescription>
              Definí qué puede hacer cada rol. Los roles de sistema son provistos por la
              aplicación y no se pueden modificar; podés crear roles custom para tu empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RolesList
              roles={roles}
              permissions={permissions}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="assignment">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios y roles</CardTitle>
            <CardDescription>
              Asigná uno o más roles a cada usuario de la empresa. Los permisos efectivos
              son la unión de todos los roles asignados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserRolesAssignment users={users} roles={roles} canAssign={canAssign} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
