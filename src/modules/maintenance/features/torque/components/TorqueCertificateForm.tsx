'use client';

import { pdf } from '@react-pdf/renderer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { torque_bolt_condition, torque_sheet_format } from '@/generated/prisma/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import {
  createTorqueCertificate,
  getTorqueSpecsByBrand,
  type TorqueCertificateCheckInput,
  type TorqueSpecOption,
  type TorqueVehicleOption,
} from '../actions.server';
import {
  formatTorqueRange,
  NUT_COUNTS,
  type NutCount,
  SHEET_FORMATS,
  TORQUE_CHECK_ITEMS,
  TORQUE_SEQUENCE_DIAGRAMS,
  type TorqueCheckKey,
} from '../shared/torque-spec';
import { TorqueCertificateLayout, type TorqueCertificatePdfData } from './pdf/TorqueCertificateLayout';

/**
 * Formulario de carga del certificado de torqueo (tsk-575). Reproduce el
 * papel que hoy llena el mecánico a mano: elige el equipo (completa patente,
 * interno y marca), ve las specs de torque de esa marca en pantalla, carga
 * los datos generales y los 15 checks, y al guardar genera y descarga el PDF.
 */

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

const today = () => new Date().toISOString().slice(0, 10);

type CheckDraft = { value: boolean | null; observations: string };
type ChecksState = Record<TorqueCheckKey, CheckDraft>;

function emptyChecks(): ChecksState {
  const state = {} as ChecksState;
  for (const item of TORQUE_CHECK_ITEMS) {
    state[item.key] = { value: null, observations: '' };
  }
  return state;
}

/**
 * Sí/No compacto para cada ítem del checklist. `id` se deriva de la key del
 * ítem (no del label): un id de HTML no debe llevar espacios y dos ítems
 * podrían compartir label.
 */
function YesNoField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm">{label}</span>
      <RadioGroup
        className="flex flex-row gap-4"
        value={value === null ? '' : value ? 'si' : 'no'}
        onValueChange={(v) => onChange(v === 'si')}
      >
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="si" id={`${id}-si`} />
          <Label htmlFor={`${id}-si`} className="font-normal text-sm">
            Sí
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="font-normal text-sm">
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export function TorqueCertificateForm({ vehicles }: { vehicles: TorqueVehicleOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const companyLogo = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const [vehicleId, setVehicleId] = useState('');
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );

  // Se guarda junto con el brandId al que corresponden: fetchedSpecs no se
  // limpia al cambiar de vehículo, así que sin este chequeo el PDF podría
  // salir con los torques de la marca anterior si el usuario cambia de
  // equipo y guarda dentro de la ventana del fetch (o si una respuesta
  // llega fuera de orden).
  const [fetchedSpecs, setFetchedSpecs] = useState<{ brandId: string; rows: TorqueSpecOption[] } | null>(null);
  // loadingSpecs sale de useTransition en vez de un useState propio: así el
  // efecto no llama a ningún setState de forma sincrónica en su cuerpo (evita
  // el render extra que marca react-hooks/set-state-in-effect).
  const [loadingSpecs, startSpecsTransition] = useTransition();
  // Derivadas del vehículo elegido, comprobando que las specs cargadas
  // correspondan a su marca — no alcanza con "hay vehículo seleccionado".
  const specs =
    selectedVehicle && fetchedSpecs?.brandId === selectedVehicle.brand_id ? fetchedSpecs.rows : [];

  const [sheetFormat, setSheetFormat] = useState<torque_sheet_format>('LIGHT');
  const [nutCount, setNutCount] = useState<NutCount | null>(null);
  const [date, setDate] = useState(today());
  const [driverName, setDriverName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [place, setPlace] = useState('');
  const [toolType, setToolType] = useState('');
  const [calibrationDi, setCalibrationDi] = useState('');
  const [calibrationDd, setCalibrationDd] = useState('');
  const [calibrationTd, setCalibrationTd] = useState('');
  const [calibrationTi, setCalibrationTi] = useState('');
  const [requiredTorque, setRequiredTorque] = useState('');
  const [meetsRequirement, setMeetsRequirement] = useState<boolean | null>(null);
  const [toleranceRangeNm, setToleranceRangeNm] = useState('');
  const [boltCondition, setBoltCondition] = useState<torque_bolt_condition | null>(null);
  const [checks, setChecks] = useState<ChecksState>(() => emptyChecks());

  // Al elegir el equipo se cargan las specs de torque de su marca, solo para
  // mostrarlas en pantalla mientras se carga el certificado (igual que en el papel).
  useEffect(() => {
    if (!selectedVehicle) return;
    let cancelled = false;
    const brandId = selectedVehicle.brand_id;
    startSpecsTransition(async () => {
      const result = await getTorqueSpecsByBrand(brandId);
      if (!cancelled) setFetchedSpecs({ brandId, rows: result });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedVehicle]);

  const previousItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'previous');
  const tighteningItems = TORQUE_CHECK_ITEMS.filter((i) => i.group === 'tightening');

  const updateCheckValue = (key: TorqueCheckKey, value: boolean) =>
    setChecks((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  const updateCheckObservations = (key: TorqueCheckKey, observations: string) =>
    setChecks((prev) => ({ ...prev, [key]: { ...prev[key], observations } }));

  const handleSubmit = () => {
    if (!vehicleId || !selectedVehicle) {
      toast.error('Seleccioná un equipo');
      return;
    }
    if (!driverName.trim() || !mechanicName.trim() || !place.trim() || !toolType.trim()) {
      toast.error('Completá los datos generales (conductor, mecánico, lugar y herramienta)');
      return;
    }
    if (!requiredTorque.trim()) {
      toast.error('Completá el torque requerido');
      return;
    }
    if (meetsRequirement === null) {
      toast.error('Indicá si cumple con el torque requerido');
      return;
    }
    if (boltCondition === null) {
      toast.error('Indicá la condición de perno y/o tuerca');
      return;
    }
    if (nutCount === null) {
      toast.error('Elegí la secuencia de apriete (cantidad de tuercas)');
      return;
    }
    const pending = TORQUE_CHECK_ITEMS.filter((item) => checks[item.key].value === null);
    if (pending.length > 0) {
      toast.error(`Faltan ${pending.length} ítem(s) del checklist por responder`);
      return;
    }

    startTransition(async () => {
      // Misma forma para la action y para el PDF: { key, value, observations }.
      const checksInput: TorqueCertificateCheckInput[] = TORQUE_CHECK_ITEMS.map((item) => ({
        key: item.key,
        value: checks[item.key].value as boolean,
        observations: item.group === 'previous' ? checks[item.key].observations.trim() || null : null,
      }));

      const result = await createTorqueCertificate({
        vehicleId,
        sheetFormat,
        nutCount,
        date: new Date(date),
        driverName: driverName.trim(),
        mechanicName: mechanicName.trim(),
        place: place.trim(),
        toolType: toolType.trim(),
        calibrationDi: calibrationDi.trim() || null,
        calibrationDd: calibrationDd.trim() || null,
        calibrationTd: calibrationTd.trim() || null,
        calibrationTi: calibrationTi.trim() || null,
        requiredTorque: requiredTorque.trim(),
        meetsRequirement,
        toleranceRangeNm: toleranceRangeNm.trim() || null,
        boltCondition,
        checks: checksInput,
      });

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo crear el certificado');
        return;
      }

      try {
        const pdfData: TorqueCertificatePdfData = {
          fullNumber: result.fullNumber ?? '',
          sheetFormat,
          nutCount,
          date,
          driverName: driverName.trim(),
          mechanicName: mechanicName.trim(),
          vehicleBrandName: selectedVehicle.brand_name,
          vehicleDomain: selectedVehicle.domain,
          vehicleInternNumber: selectedVehicle.intern_number,
          place: place.trim(),
          toolType: toolType.trim(),
          calibrationDi: calibrationDi.trim() || null,
          calibrationDd: calibrationDd.trim() || null,
          calibrationTd: calibrationTd.trim() || null,
          calibrationTi: calibrationTi.trim() || null,
          checks: checksInput,
          requiredTorque: requiredTorque.trim(),
          meetsRequirement,
          toleranceRangeNm: toleranceRangeNm.trim() || null,
          boltCondition,
        };

        const blob = await pdf(
          <TorqueCertificateLayout data={pdfData} specs={specs} logoUrl={companyLogo} />
        ).toBlob();
        const fileLabel = selectedVehicle.domain ?? selectedVehicle.intern_number;
        download(blob, `Certificado_torqueo_${fileLabel}.pdf`);
      } catch (error) {
        console.error('Error al generar el PDF del certificado de torqueo:', error);
        toast.error('El certificado se guardó, pero no se pudo generar el PDF');
      }

      toast.success('Certificado de torqueo creado');
      router.push('/dashboard/maintenance/torque');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/maintenance">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo certificado de torqueo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Equipo</Label>
            <SearchableSelect
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.intern_number} — ${v.domain ?? v.serie ?? 'sin patente'}${v.brand_name ? ` (${v.brand_name})` : ''}`,
              }))}
              value={vehicleId}
              onValueChange={setVehicleId}
              placeholder="Seleccionar equipo"
              searchPlaceholder="Buscar por interno, patente o marca..."
              emptyMessage="No se encontró el equipo."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Patente</Label>
            <Input value={selectedVehicle?.domain ?? selectedVehicle?.serie ?? ''} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>N° Interno</Label>
            <Input value={selectedVehicle?.intern_number ?? ''} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input value={selectedVehicle?.brand_name ?? ''} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Formato de hoja</Label>
            <Select value={sheetFormat} onValueChange={(v) => setSheetFormat(v as torque_sheet_format)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHEET_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specs de torque de la marca elegida: solo lectura, para que el
              mecánico las vea mientras carga el certificado (igual que en el papel). */}
          {selectedVehicle && (
            <div className="md:col-span-4 space-y-1.5">
              <Label>Torques de referencia — {selectedVehicle.brand_name ?? 'sin marca'}</Label>
              {loadingSpecs ? (
                <p className="text-sm text-muted-foreground">Cargando specs...</p>
              ) : specs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay specs de torque cargadas para esta marca.
                </p>
              ) : (
                <ul className="rounded-md border p-3 text-sm space-y-1">
                  {specs.map((spec) => (
                    <li key={spec.configuration}>
                      <span className="font-medium">{spec.configuration}:</span>{' '}
                      {formatTorqueRange(spec)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Conductor</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mecánico</Label>
            <Input value={mechanicName} onChange={(e) => setMechanicName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lugar</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Herramienta de Torque (tipo/Modelo)</Label>
            <Input value={toolType} onChange={(e) => setToolType(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Calibración DI</Label>
            <Input value={calibrationDi} onChange={(e) => setCalibrationDi(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Calibración DD</Label>
            <Input value={calibrationDd} onChange={(e) => setCalibrationDd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Calibración TD</Label>
            <Input value={calibrationTd} onChange={(e) => setCalibrationTd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Calibración TI</Label>
            <Input value={calibrationTi} onChange={(e) => setCalibrationTi(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Verificación previas</CardTitle>
          <CardDescription>Los 7 ítems previos al torqueo, con observaciones si corresponde.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {previousItems.map((item) => (
            <div key={item.key} className="py-2 first:pt-0 last:pb-0">
              <YesNoField
                id={item.key}
                label={item.label}
                value={checks[item.key].value}
                onChange={(value) => updateCheckValue(item.key, value)}
              />
              <Textarea
                placeholder="Observaciones (opcional)"
                value={checks[item.key].observations}
                onChange={(e) => updateCheckObservations(item.key, e.target.value)}
                rows={1}
                className="mt-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Especificaciones de torque</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Torque requerido</Label>
            <Input value={requiredTorque} onChange={(e) => setRequiredTorque(e.target.value)} placeholder="Ej: 450 Nm" />
          </div>
          <div className="space-y-1.5">
            <Label>Cumple con el torque requerido</Label>
            <RadioGroup
              className="flex flex-row gap-4 h-9 items-center"
              value={meetsRequirement === null ? '' : meetsRequirement ? 'si' : 'no'}
              onValueChange={(v) => setMeetsRequirement(v === 'si')}
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="si" id="meets-si" />
                <Label htmlFor="meets-si" className="font-normal">
                  Sí
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="no" id="meets-no" />
                <Label htmlFor="meets-no" className="font-normal">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <Label>Rango de tolerancia</Label>
            <div className="relative">
              {/* El PDF ya imprime " Nm" después del valor: acá va solo el
                  número o rango, sin unidad, para no duplicarla. */}
              <Input
                value={toleranceRangeNm}
                onChange={(e) => setToleranceRangeNm(e.target.value)}
                placeholder="Ej: 440-460 (sin unidad)"
                className="pr-10"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                Nm
              </span>
            </div>
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Label>Condiciones de perno y/o tuerca</Label>
            <RadioGroup
              className="flex flex-row gap-4 h-9 items-center"
              value={boltCondition ?? ''}
              onValueChange={(v) => setBoltCondition(v as torque_bolt_condition)}
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="DRY" id="bolt-dry" />
                <Label htmlFor="bolt-dry" className="font-normal">
                  Seco
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="LUBRICATED" id="bolt-lubricated" />
                <Label htmlFor="bolt-lubricated" className="font-normal">
                  Lubricado
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Secuencia de apriete</CardTitle>
          <CardDescription>
            La secuencia según la cantidad de tuercas de la rueda, y los 8 checks de apriete.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="w-full space-y-1.5 sm:max-w-56">
              <Label>Secuencia (cantidad de tuercas)</Label>
              <Select
                value={nutCount === null ? '' : String(nutCount)}
                onValueChange={(v) => setNutCount(Number(v) as NutCount)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar secuencia" />
                </SelectTrigger>
                <SelectContent>
                  {NUT_COUNTS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} tuercas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Vista previa del mismo asset que imprime el PDF: el mecánico
                confirma que eligió la secuencia correcta antes de guardar. */}
            {nutCount !== null && (
              <div className="rounded-md border bg-white p-2">
                <img
                  src={TORQUE_SEQUENCE_DIAGRAMS[nutCount]}
                  alt={`Secuencia de apriete de ${nutCount} tuercas`}
                  className="h-24 w-auto object-contain"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {tighteningItems.map((item) => (
              <YesNoField
                key={item.key}
                id={item.key}
                label={item.label}
                value={checks[item.key].value}
                onChange={(value) => updateCheckValue(item.key, value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar y descargar PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
