'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  KeyRound,
  Mail,
  Shield,
  ShieldOff,
  User,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { approveUserRequest, getPendingRequests, removeUserAccess } from '../actions/actions';

// Server actions que se implementarán luego
// import { approveUserRequest, rejectUserRequest, blockUser, unblockUser, resetUserPassword } from '../actions/portalActions';

export default function AcceptPage({
  pendingRequests,
  approvedUsers,
}: {
  pendingRequests: Awaited<ReturnType<typeof getPendingRequests>>;
  approvedUsers: Awaited<ReturnType<typeof getPendingRequests>>;
}) {
  // Adaptamos los datos para que tengan el formato que espera el componente
  const formattedPendingRequests = pendingRequests.map((user) => ({
    id: user.user_id,
    user_id: user.user_id,
    email: user.email,
    user_cuil: user.user_cuil,
    employee_id: user.employee_id,
    first_name: user.first_name,
    last_name: user.last_name,
    company_id: user.company_id,
    status: 'pending',
    requestDate: user.user_created_at,
    raw_user_meta_data: user.raw_user_meta_data,
  }));

  const formattedApprovedUsers = approvedUsers.map((user) => ({
    id: user.user_id,
    user_id: user.user_id,
    email: user.email,
    user_cuil: user.user_cuil,
    employee_id: user.employee_id,
    first_name: user.first_name,
    last_name: user.last_name,
    company_id: user.company_id,
    status: 'approved',
    approvedDate: user.user_created_at,
    raw_user_meta_data: user.raw_user_meta_data,
  }));

  const [selectedRequest, setSelectedRequest] = useState<(typeof formattedPendingRequests)[0] | null>(null);
  const [selectedUser, setSelectedUser] = useState<(typeof formattedApprovedUsers)[0] | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'block' | 'unblock' | 'reset-password' | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const router = useRouter();

  // Manejadores de acciones
  const handlePendingAction = (request: (typeof formattedPendingRequests)[0], action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setSelectedUser(null);
    setModalAction(action);
  };

  const handleUserAction = async (
    user: (typeof formattedApprovedUsers)[0],
    action: 'block' | 'unblock' | 'reset-password'
  ) => {
    setSelectedUser(user);
    setSelectedRequest(null);
    setModalAction(action);
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      // Aquí implementaremos llamadas a server actions
      if (selectedRequest && (modalAction === 'approve' || modalAction === 'reject')) {
        // Manejar solicitudes pendientes usando server actions
        if (modalAction === 'approve') {
          // Llamada a server action para aprobar usuario (a implementar)
          await approveUserRequest(selectedRequest.user_id);
          router.refresh();
        } else {
          // Llamada a server action para rechazar usuario (a implementar)
          // await rejectUserRequest({
          //   userId: selectedRequest.user_id,
          //   employeeId: selectedRequest.employee_id,
          // });

          console.log('Rechazar acceso para:', selectedRequest);
        }

        // Mostrar mensaje de éxito
        setMessage({
          type: 'success',
          text: modalAction === 'approve' ? 'Acceso aprobado correctamente' : 'Solicitud rechazada',
        });
      } else if (selectedUser) {
        // Manejar acciones de usuarios aprobados
        if (modalAction === 'block') {
          // Llamada a server action para bloquear usuario (a implementar)
          const data = await removeUserAccess(selectedUser?.user_id);
          console.log(data, 'data');
          router.refresh();
        } else if (modalAction === 'unblock') {
          // Llamada a server action para desbloquear usuario (a implementar)
          // await unblockUser({
          //   userId: selectedUser.user_id,
          // });

          console.log('Desbloquear usuario:', selectedUser);
        } else if (modalAction === 'reset-password') {
          // Llamada a server action para resetear contraseña (a implementar)
          // await resetUserPassword({
          //   userId: selectedUser.user_id,
          //   email: selectedUser.email,
          // });

          console.log('Resetear contraseña para:', selectedUser);
        }

        // Mostrar mensaje de éxito
        setMessage({
          type: 'success',
          text:
            modalAction === 'block'
              ? 'Usuario bloqueado correctamente'
              : modalAction === 'unblock'
                ? 'Usuario desbloqueado correctamente'
                : 'Correo de recuperación de contraseña enviado',
        });
      }

      // Cerrar modal después de un tiempo
      setTimeout(() => {
        setModalAction(null);
        setSelectedRequest(null);
        setSelectedUser(null);
      }, 1000);
    } catch (error) {
      console.error('Error al procesar la acción:', error);
      setMessage({
        type: 'error',
        text: 'Error al procesar la solicitud',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setSelectedRequest(null);
      setSelectedUser(null);
      setModalAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        );
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeUsers = approvedUsers.filter((user) => (user.raw_user_meta_data as any)?.verified === 'approved');
  const blockedUsers = approvedUsers.filter((user) => (user.raw_user_meta_data as any)?.verified === 'blocked');

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Solicitudes Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <p className="text-sm text-gray-600">Esperando aprobación</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Usuarios Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
              <p className="text-sm text-gray-600">Con acceso aprobado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Usuarios Bloqueados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{blockedUsers.length}</div>
              <p className="text-sm text-gray-600">Acceso restringido</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{approvedUsers.length}</div>
              <p className="text-sm text-gray-600">En el Portal de Empleados</p>
            </CardContent>
          </Card>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Solicitudes Pendientes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrar Acceso ({approvedUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Solicitudes Pendientes */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Acceso Pendientes</CardTitle>
                <CardDescription>Revisa y aprueba las solicitudes de empleados para acceder al portal</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedPendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-gray-600">Todas las solicitudes han sido procesadas.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>CUIL</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Fecha Solicitud</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formattedPendingRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {request.first_name} {request.last_name}
                                  </div>
                                  {/* <div className="text-sm text-gray-500">{request.raw_user_meta_data?.position || 'No especificado'}</div> */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{request.user_cuil}</TableCell>
                            {/* <TableCell>{request.raw_user_meta_data?.department || 'No especificado'}</TableCell> */}
                            <TableCell>{request.email}</TableCell>
                            <TableCell>{formatDate(request.requestDate)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handlePendingAction(request, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePendingAction(request, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Administrar Acceso */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Administrar Acceso de Usuarios</CardTitle>
                <CardDescription>
                  Gestiona el acceso de usuarios ya aprobados - bloquea, desbloquea cuentas o envía cambio de contraseña
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formattedApprovedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios con acceso</h3>
                    <p className="text-gray-600">Aún no se han aprobado solicitudes de acceso.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>CUIL</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Fecha Aprobación</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formattedApprovedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    user.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                                  }`}
                                >
                                  {user.status === 'approved' ? (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  {/* <div className="text-sm text-gray-500">{user.raw_user_meta_data?.position || 'No especificado'}</div> */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{user.user_cuil}</TableCell>
                            {/* <TableCell>{user.raw_user_meta_data?.department || 'No especificado'}</TableCell> */}
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.approvedDate ? formatDate(user.approvedDate) : 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="destructive" onClick={() => handleUserAction(user, 'block')}>
                                  <ShieldOff className="h-4 w-4 mr-1" />
                                  Remover acceso
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de confirmación */}
        <Dialog open={!!(selectedRequest || selectedUser) && !!modalAction} onOpenChange={handleCloseModal}>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>
                {modalAction === 'approve' && 'Aprobar Solicitud'}
                {modalAction === 'reject' && 'Rechazar Solicitud'}
                {modalAction === 'block' && 'Bloquear Acceso'}
                {modalAction === 'unblock' && 'Desbloquear Acceso'}
                {modalAction === 'reset-password' && 'Enviar Cambio de Contraseña'}
              </DialogTitle>
              <DialogDescription>
                {modalAction === 'approve' &&
                  '¿Estás seguro de que deseas aprobar el acceso al portal para este empleado?'}
                {modalAction === 'reject' &&
                  '¿Estás seguro de que deseas rechazar la solicitud de acceso de este empleado?'}
                {modalAction === 'block' &&
                  '¿Estás seguro de que deseas bloquear el acceso al portal para este usuario?'}
                {modalAction === 'unblock' &&
                  '¿Estás seguro de que deseas desbloquear el acceso al portal para este usuario?'}
                {modalAction === 'reset-password' &&
                  '¿Estás seguro de que deseas enviar un correo de cambio de contraseña a este usuario? El usuario recibirá un enlace para restablecer su contraseña.'}
              </DialogDescription>
            </DialogHeader>

            {(selectedRequest || selectedUser) && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {modalAction === 'reset-password' ? (
                        <KeyRound className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedRequest
                          ? `${selectedRequest.first_name} ${selectedRequest.last_name}`
                          : `${selectedUser?.first_name} ${selectedUser?.last_name}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        CUIL: {selectedRequest ? selectedRequest.user_cuil : selectedUser?.user_cuil}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedRequest
                          ? selectedRequest.raw_user_meta_data?.position || 'No especificado'
                          : selectedUser?.raw_user_meta_data?.position || 'No especificado'}
                      </span>
                    </div> */}
                    {/* <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedRequest
                          ? selectedRequest.raw_user_meta_data?.department || 'No especificado'
                          : selectedUser?.raw_user_meta_data?.department || 'No especificado'}
                      </span>
                    </div> */}
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{selectedRequest ? selectedRequest.email : selectedUser?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedRequest
                          ? formatDate(selectedRequest.requestDate)
                          : selectedUser?.approvedDate
                            ? formatDate(selectedUser.approvedDate)
                            : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {modalAction === 'reset-password' && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700 font-medium">
                          Se enviará el correo a: {selectedUser?.email}
                        </span>
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        El usuario recibirá instrucciones para crear una nueva contraseña.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={isProcessing}
                variant={
                  modalAction === 'approve' || modalAction === 'unblock'
                    ? 'default'
                    : modalAction === 'reset-password'
                      ? 'outline'
                      : 'destructive'
                }
                className={
                  modalAction === 'reset-password'
                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent'
                    : ''
                }
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {modalAction === 'approve' && (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar Acceso
                      </>
                    )}
                    {modalAction === 'reject' && (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar Solicitud
                      </>
                    )}
                    {modalAction === 'block' && (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Bloquear Usuario
                      </>
                    )}
                    {modalAction === 'unblock' && (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Desbloquear Usuario
                      </>
                    )}
                    {modalAction === 'reset-password' && (
                      <>
                        <KeyRound className="h-4 w-4 mr-2" />
                        Enviar Correo
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
