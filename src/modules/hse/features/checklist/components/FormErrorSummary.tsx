'use client';

import { AlertCircle } from 'lucide-react';
import { Control, FieldValues, useFormState } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { countFieldErrors } from '@/shared/lib/form-errors';

/**
 * Aviso persistente de campos sin completar, para poner junto al botón de guardar.
 *
 * El toast solo no alcanza en el celular: dura unos segundos, aparece lejos del
 * campo y el chofer que mira tarde se queda sin saber qué pasó. Esto se queda en
 * pantalla hasta que el checklist está completo, y el contador baja a medida que
 * se responde.
 *
 * Se suscribe con `useFormState` en vez de leer `form.formState` en el
 * componente padre: así el contador re-renderiza solo este bloque y no el
 * formulario entero en cada tecla.
 */
export function FormErrorSummary<TFieldValues extends FieldValues>({
  control,
  onGoToFirstError,
}: {
  control: Control<TFieldValues>;
  onGoToFirstError: () => void;
}) {
  const { errors, isSubmitted } = useFormState({ control });
  const total = countFieldErrors(errors);
  const visible = isSubmitted && total > 0;

  // El contenedor se monta siempre, aunque esté vacío: si apareciera y
  // desapareciera, un lector de pantalla podría no anunciar el segundo intento
  // fallido.
  return (
    <div role="alert" aria-live="assertive" className="w-full">
      {visible && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {total === 1 ? 'Falta 1 respuesta para poder guardar' : `Faltan ${total} respuestas para poder guardar`}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Los campos incompletos están marcados en rojo.</span>
            <Button type="button" variant="outline" size="sm" onClick={onGoToFirstError} className="w-full sm:w-auto">
              Ir al primero
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
