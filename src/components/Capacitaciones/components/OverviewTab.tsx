'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { sendEmail } from '@/lib/renderEmail';
import { CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fetchTrainingById, updateTrainingStatus } from '../actions/actions';

function OverviewTab({ training }: { training: Awaited<ReturnType<typeof fetchTrainingById>> }) {
  // Calcular métricas importantes
  const completedCount = training?.employees?.completed?.length || 0;
  const totalEmployees = training?.employees?.total?.totalEmployees || 0;

  const sendReminder = () => {
    toast.promise(
      sendEmail({
        to: training?.employees?.pending?.map((employee) => employee.email).filter(Boolean) || '',
        subject: `Recordatorio: Capacitación "${training?.title}"`,
        html: `
        <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recordatorio de Capacitación</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2563eb;
              padding: 20px;
              text-align: center;
              color: white;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #fff;
              padding: 20px;
              border-left: 1px solid #e5e7eb;
              border-right: 1px solid #e5e7eb;
            }
            .footer {
              background-color: #f3f4f6;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-radius: 0 0 5px 5px;
              border: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .training-details {
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
            }
            .importance {
              display: inline-block;
              background-color: #ef4444;
              color: white;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Capacitación</h1>
            </div>
            <div class="content">
              <p>Estimado/a colaborador/a,</p>
              <p>Le recordamos que tiene una <strong>capacitación pendiente</strong> que requiere su atención.</p>
              
              <div class="training-details">
                <span class="importance">Importante</span>
                <h2>${training?.title}</h2>

                ${training?.description ? `<p><strong>Descripción:</strong> ${training?.description}</p>` : ''}
              </div>
              
              <p>Por favor complete esta capacitación a la brevedad posible. El conocimiento adquirido es fundamental para su seguridad y desempeño laboral.</p>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/hse/detail/${training?.id}" class="button">Ver Capacitación</a>
              </center>
              
              <p>Si tiene alguna duda o inconveniente, no dude en contactar a su supervisor.</p>
              
              <p>Saludos cordiales,<br>El equipo de HSE</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático, por favor no responda a este correo.</p>
              <p> ${new Date().getFullYear()} Code Control - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
      `,
      }),
      {
        loading: 'Enviando recordatorio...',
        success: 'Recordatorio enviado exitosamente',
        error: 'Error al enviar recordatorio',
      }
    );
  };

  const archiveTraining = async () => {
    toast.promise(updateTrainingStatus(training?.id || '', 'Archivado'), {
      loading: 'Archivando capacitación...',
      success: 'Capacitación archivada exitosamente',
      error: 'Error al archivar capacitación',
    });
  };

  const publishTraining = async () => {
    toast.promise(updateTrainingStatus(training?.id || '', 'Publicado'), {
      loading: 'Publicando capacitación...',
      success: 'Capacitación publicada exitosamente',
      error: 'Error al publicar capacitación',
    });
  };

  console.log(training);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha de creación:</span>
            <span>{training?.createdDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado:</span>
            <Badge variant={training?.status === 'Publicado' ? 'default' : 'secondary'}>{training?.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materiales:</span>
            <span>{training?.materials.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preguntas:</span>
            <span>{training?.evaluation?.questions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Puntaje mínimo:</span>
            {training?.evaluation?.passingScore && training?.evaluation?.questions.length ? (
              <span>
                {training?.evaluation?.passingScore}/{training?.evaluation?.questions.length} (
                {Math.round((training?.evaluation?.passingScore / training?.evaluation?.questions.length) * 100)}%)
              </span>
            ) : (
              <Badge variant="outline">Sin información</Badge>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Etiquetas:</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {training?.tags?.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progreso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {completedCount}/{totalEmployees}
            </div>
            <p className="text-muted-foreground">Empleados completaron</p>
          </div>
          <Progress value={(completedCount / totalEmployees) * 100 || 0} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>{Math.round((completedCount / totalEmployees) * 100) || 0}% completado</span>
            <span>{totalEmployees - completedCount} pendientes</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" onClick={sendReminder} className="w-full justify-start">
            <Send className="h-4 w-4 mr-2" />
            Enviar recordatorio a todos
          </Button>
          {training?.status === 'Publicado' && (
            <Button variant="outline" onClick={archiveTraining} className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Archivada
            </Button>
          )}
          {training?.status === 'Borrador' && (
            <Button variant="outline" onClick={publishTraining} className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Publicar Capacitación
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OverviewTab;
