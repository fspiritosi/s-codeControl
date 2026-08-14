'use client';

import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { pdf } from '@react-pdf/renderer';
import { Download, FileCheck2, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { closeTraining } from '../actions.server';
import {
  archiveCertificateInEmployeeFile,
  buildTrainingCertificate,
  buildTrainingEvaluation,
  buildTrainingRecord,
} from '../record-actions.server';
import { TrainingCertificateLayout } from './pdf/TrainingCertificateLayout';
import { TrainingEvaluationLayout } from './pdf/TrainingEvaluationLayout';
import { TrainingRecordLayout } from './pdf/TrainingRecordLayout';

const download = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.replace(/\s+/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Acciones del registro de capacitación (tsk-540).
 *
 * El registro grupal es solo para administradores y no se archiva en ningún
 * legajo: el cliente pidió expresamente que quede acá.
 */
export function TrainingRecordActions({
  trainingId,
  trainingTitle,
  status,
  isAdmin,
}: {
  trainingId: string;
  trainingTitle: string;
  status: string | null;
  isAdmin: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  if (!isAdmin) return null;

  const isClosed = status === 'Cerrada';

  const handleDownloadRecord = async () => {
    setIsDownloading(true);
    try {
      const payload = await buildTrainingRecord(trainingId);
      if (!payload) {
        toast.error('No se pudo generar el registro');
        return;
      }

      const blob = await pdf(
        <TrainingRecordLayout
          header={payload.header}
          rows={payload.rows}
          logoUrl={payload.logoUrl}
          draft={payload.draft}
        />
      ).toBlob();

      const suffix = payload.draft ? 'provisorio' : 'definitivo';
      download(blob, `Registro_capacitacion_${trainingTitle}_${suffix}.pdf`);

      if (payload.rows.length === 0) {
        toast.info('El registro se descargó sin empleados: todavía no hay nadie que haya aprobado.');
      }
    } catch (error: any) {
      console.error('Error al generar el registro:', error);
      toast.error('Error al generar el registro');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const result = await closeTraining(trainingId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Capacitación cerrada. El registro quedó definitivo.');
      router.refresh();
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={handleDownloadRecord} disabled={isDownloading}>
        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {isClosed ? 'Descargar registro definitivo' : 'Descargar registro provisorio'}
      </Button>

      {!isClosed && status === 'Publicado' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="default" disabled={isClosing}>
              {isClosing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Cerrar capacitación
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cerrar la capacitación?</AlertDialogTitle>
              <AlertDialogDescription>
                El registro queda definitivo con los empleados que aprobaron hasta ahora y deja de incorporar gente.
                Antes de cerrar tenés que haber completado el método de evaluación de la eficacia y las nuevas
                acciones.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose}>Cerrar capacitación</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/**
 * Constancia y evaluación de un empleado. Van por intento aprobado, no por
 * capacitación.
 */
export function TrainingEmployeeDocuments({
  attemptId,
  employeeName,
  trainingTitle,
}: {
  attemptId: string;
  employeeName: string;
  trainingTitle: string;
}) {
  const [busy, setBusy] = useState<'certificate' | 'evaluation' | null>(null);

  const handleCertificate = async () => {
    setBusy('certificate');
    try {
      const payload = await buildTrainingCertificate(attemptId);
      if (!payload) {
        toast.error('No se pudo generar la constancia');
        return;
      }

      const blob = await pdf(
        <TrainingCertificateLayout data={payload.data} logoUrl={payload.logoUrl} />
      ).toBlob();

      download(blob, `Constancia_${trainingTitle}_${employeeName}.pdf`);

      // La constancia es el único documento que va al legajo del empleado.
      const archived = await archiveCertificateInEmployeeFile(attemptId, blob);
      if (!archived.success) {
        toast.error(`La constancia se descargó pero no se archivó: ${archived.error}`);
      } else if (archived.alreadyArchived) {
        toast.info('La constancia ya estaba archivada en el legajo.');
      } else {
        toast.success('Constancia archivada en el legajo del empleado.');
      }
    } catch (error: any) {
      console.error('Error al generar la constancia:', error);
      toast.error('Error al generar la constancia');
    } finally {
      setBusy(null);
    }
  };

  const handleEvaluation = async () => {
    setBusy('evaluation');
    try {
      const payload = await buildTrainingEvaluation(attemptId);
      if (!payload) {
        toast.error('No se pudo generar la evaluación');
        return;
      }

      const blob = await pdf(<TrainingEvaluationLayout data={payload.data} logoUrl={payload.logoUrl} />).toBlob();
      download(blob, `Evaluacion_${trainingTitle}_${employeeName}.pdf`);
    } catch (error: any) {
      console.error('Error al generar la evaluación:', error);
      toast.error('Error al generar la evaluación');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCertificate} disabled={busy !== null}>
        {busy === 'certificate' ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <FileCheck2 className="mr-2 h-3 w-3" />
        )}
        Constancia
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleEvaluation} disabled={busy !== null}>
        {busy === 'evaluation' ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-2 h-3 w-3" />
        )}
        Evaluación
      </Button>
    </div>
  );
}
