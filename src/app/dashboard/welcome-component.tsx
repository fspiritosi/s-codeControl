import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheckIcon, MailIcon, MapPinIcon, PhoneIcon, TruckIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { fetchCurrentCompany } from '../server/GET/actions';

export default async function WelcomeComponent() {
  const currentCompany = await fetchCurrentCompany();
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-9">
      {/* Hero Section */}
      <section className="text-center space-y-6 pb-12">
        <Badge className="px-4 py-1 rounded-full text-sm" variant="secondary">
          Bienvenido a CodeControl - Sistema de Control y Gestión
        </Badge>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
          Gestión Integral de Flotas y Personal
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ingresaste como usuario invitado de la empresa <strong>{currentCompany[0].company_name}</strong>
        </p>
        {/* <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mantén el control total de tus operaciones: personal, vehículos, documentación y mantenimientos, 
          todo integrado en una sola plataforma diseñada para tu eficiencia.
        </p> */}
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        <Link href="/dashboard/employee">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <UsersIcon className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Control de Personal</CardTitle>
              <CardDescription>Gestiona empleados de tu contratista y su documentación</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/equipment">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <TruckIcon className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Control Vehicular</CardTitle>
              <CardDescription>Gestiona los equipos de tu contratista y su documentación</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/forms">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <ClipboardCheckIcon className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Checklists</CardTitle>
              <CardDescription>
                Formularios digitales para inspecciones diarias, reportes de mantenimiento y control de reparaciones.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* Benefits Section
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Funcionalidades Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex items-start space-x-4">
              <UsersIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Gestión de Accesos</h3>
                <p className="text-muted-foreground">
                  Sistema multinivel: administradores, supervisores, conductores y clientes. Cada uno con sus permisos
                  específicos.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex items-start space-x-4">
              <FileTextIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Control Documental</h3>
                <p className="text-muted-foreground">
                  Gestión de documentos de vehículos y personal, con alertas de vencimientos y renovaciones pendientes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex items-start space-x-4">
              <CalendarCheckIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Mantenimientos</h3>
                <p className="text-muted-foreground">
                  Programación y seguimiento de mantenimientos preventivos y correctivos de la flota.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex items-start space-x-4">
              <BarChart3Icon className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Reportes y Análisis</h3>
                <p className="text-muted-foreground">
                  Seguimiento de gastos, historial de mantenimientos y control de documentación vencida.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section> */}

      {/* Contact Section */}
      <Card className="bg-primary/5 border-none shadow-lg">
        <CardContent className="p-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold mb-4">Soporte y Ayuda</h2>
            <p className="text-lg text-muted-foreground mb-6">
              ¿Necesitas ayuda con alguna funcionalidad? Nuestro equipo de soporte está disponible para asistirte.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-primary" />
                <span>+54 (299) 581-0946</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <MailIcon className="h-5 w-5 text-primary" />
                <span>info@codecontrol.com.ar</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-primary" />
                <span>Neuquén, Argentina</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
