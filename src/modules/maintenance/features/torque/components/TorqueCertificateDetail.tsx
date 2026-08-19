'use client';

import { pdf } from '@react-pdf/renderer';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import type { getTorqueCertificateById } from '../actions.server';
import { getTorqueSpecsByBrand } from '../actions.server';
import { checkLabel, SHEET_FORMATS, TORQUE_CHECK_ITEMS, type TorqueCheckKey } from '../shared/torque-spec';
import { TorqueCertificateLayout, type TorqueCertificatePdfData } from './pdf/TorqueCertificateLayout';

/**
 * Detalle de un certificado de torqueo ya emitido, con reimpresión (tsk-575
 * task 6). El botón regenera el PDF a partir del registro guardado: no pide
 * de nuevo ningún dato, solo vuelve a traer las specs de torque de la marca
 * (no se snapshotean) para reconstruir la sección 5 del documento.
 */

// El certificado llega serializado desde el wrapper (page.tsx): `vehicle.brand`
// (BigInt) no puede cruzar el límite server->client tal cual, así que viaja
// como `vehicleBrandId` (string) y se descarta la relación cruda.
export type TorqueCertificateDetailData = Omit<
  NonNullable<Awaited<ReturnType<typeof getTorqueCertificateById>>>,
  'vehicle'
> & { vehicleBrandId: string | null };

const SHEET_FORMAT_LABEL = new Map(SHEET_FORMATS.map((f) => [f.value, f.label]));

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export function TorqueCertificateDetail({ certificate }: { certificate: TorqueCertificateDetailData }) {
  const [isPending, startTransition] = useTransition();
  const companyLogo = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const previousItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'previous');
  const tighteningItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'tightening');
  const checksByKey = new Map(certificate.checks.map((c) => [c.item_key as TorqueCheckKey, c]));

  const handleReprint = () => {
    startTransition(async () => {
      try {
        const specs = certificate.vehicleBrandId
          ? await getTorqueSpecsByBrand(certificate.vehicleBrandId)
          : [];

        const pdfData: TorqueCertificatePdfData = {
          fullNumber: certificate.full_number,
          sheetFormat: certificate.sheet_format,
          date: new Date(certificate.date).toISOString().slice(0, 10),
          driverName: certificate.driver_name,
          mechanicName: certificate.mechanic_name,
          vehicleBrandName: certificate.vehicle_brand_name,
          vehicleDomain: certificate.vehicle_domain,
          vehicleInternNumber: certificate.vehicle_intern_number,
          place: certificate.place,
          toolType: certificate.tool_type,
          calibrationDi: certificate.calibration_di,
          calibrationDd: certificate.calibration_dd,
          calibrationTd: certificate.calibration_td,
          calibrationTi: certificate.calibration_ti,
          checks: certificate.checks.map((c) => ({
            key: c.item_key as TorqueCheckKey,
            value: c.value,
            observations: c.observations,
          })),
          requiredTorque: certificate.required_torque,
          meetsRequirement: certificate.meets_requirement,
          toleranceRangeNm: certificate.tolerance_range_nm,
          boltCondition: certificate.bolt_condition,
        };

        const blob = await pdf(
          <TorqueCertificateLayout data={pdfData} specs={specs} logoUrl={companyLogo} />
        ).toBlob();
        const fileLabel = certificate.vehicle_domain ?? certificate.vehicle_intern_number ?? certificate.full_number;
        download(blob, `Certificado_torqueo_${fileLabel}.pdf`);
      } catch (error) {
        console.error('Error al regenerar el PDF del certificado de torqueo:', error);
        toast.error('No se pudo regenerar el PDF');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/maintenance/torque">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Certificado {certificate.full_number}</h1>
          <Badge variant="secondary">{SHEET_FORMAT_LABEL.get(certificate.sheet_format) ?? certificate.sheet_format}</Badge>
        </div>
        <Button onClick={handleReprint} disabled={isPending}>
          <Printer className="mr-2 size-4" />
          {isPending ? 'Generando...' : 'Reimprimir PDF'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Fecha" value={formatDateUTC(certificate.date)} />
          <Field label="Conductor" value={certificate.driver_name} />
          <Field label="Mecánico" value={certificate.mechanic_name} />
          <Field label="Cargado por" value={certificate.created_by_rel?.fullname} />
          <Field label="Marca" value={certificate.vehicle_brand_name} />
          <Field label="Patente" value={certificate.vehicle_domain} />
          <Field label="N° Interno" value={certificate.vehicle_intern_number} />
          <Field label="Lugar" value={certificate.place} />
          <Field label="Herramienta (tipo/modelo)" value={certificate.tool_type} />
          <Field label="Calibración DI" value={certificate.calibration_di} />
          <Field label="Calibración DD" value={certificate.calibration_dd} />
          <Field label="Calibración TD" value={certificate.calibration_td} />
          <Field label="Calibración TI" value={certificate.calibration_ti} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Especificaciones de torque</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Torque requerido" value={certificate.required_torque} />
          <Field label="Cumple" value={certificate.meets_requirement ? 'Sí' : 'No'} />
          <Field
            label="Rango de tolerancia"
            value={certificate.tolerance_range_nm ? `${certificate.tolerance_range_nm} Nm` : null}
          />
          <Field label="Condición de perno/tuerca" value={certificate.bolt_condition === 'DRY' ? 'Seco' : 'Lubricado'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificaciones previas</CardTitle>
          <CardDescription>Los 7 ítems previos al torqueo, con observaciones si corresponde.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {previousItems.map((item) => {
            const check = checksByKey.get(item.key);
            return (
              <div key={item.key} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm">{checkLabel(item.key)}</p>
                  {check?.observations && (
                    <p className="text-xs text-muted-foreground">{check.observations}</p>
                  )}
                </div>
                <Badge variant={check?.value ? 'success' : 'destructive'}>{check?.value ? 'Sí' : 'No'}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secuencia de apriete</CardTitle>
          <CardDescription>Los 8 checks de apriete.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tighteningItems.map((item) => {
            const check = checksByKey.get(item.key);
            return (
              <div key={item.key} className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm">{checkLabel(item.key)}</span>
                <Badge variant={check?.value ? 'success' : 'destructive'}>{check?.value ? 'Sí' : 'No'}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
