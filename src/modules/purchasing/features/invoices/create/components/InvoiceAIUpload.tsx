'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, UploadCloud, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import { extractInvoiceDataFromFile } from '@/modules/purchasing/features/invoices/create/actions.server';
import {
  mapExtractedToForm,
  type MapExtractedToFormResult,
  type SupplierForMatch,
} from '@/modules/purchasing/shared/invoice-extraction/map-to-form';

/** Payload que recibe el form cuando la extracción terminó OK. */
export interface InvoiceExtractionResult extends MapExtractedToFormResult {
  /** Archivo original, para reusarlo como adjunto al guardar. */
  file: File;
}

interface Props {
  /** Proveedores ya pre-fetcheados por la page, para matchear el CUIT. */
  suppliers: SupplierForMatch[];
  /** Callback con los datos extraídos + mapeados al form. */
  onExtracted: (result: InvoiceExtractionResult) => void;
  /** Deshabilita la zona (ej. mientras se guarda la factura). */
  disabled?: boolean;
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png';

/**
 * Mensajes de etapa que se rotan mientras la AI procesa el archivo.
 * El progreso real es indeterminado (no conocemos el % exacto del lado del
 * servidor), por eso no inventamos un porcentaje: rotamos texto + spinner.
 */
const EXTRACTION_STAGES = [
  'Subiendo archivo…',
  'Analizando la factura con IA…',
  'Extrayendo importes y datos…',
  'Casi listo…',
] as const;

/** Cada cuántos ms rota el mensaje de etapa. */
const STAGE_ROTATION_MS = 2500;

export default function InvoiceAIUpload({ suppliers, onExtracted, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  // Rota el mensaje de etapa mientras `loading`, y lo limpia al terminar.
  useEffect(() => {
    if (!loading) {
      setStageIndex(0);
      return;
    }
    const id = setInterval(() => {
      // Avanza hasta la última etapa y se queda ahí (no vuelve a empezar).
      setStageIndex((prev) => Math.min(prev + 1, EXTRACTION_STAGES.length - 1));
    }, STAGE_ROTATION_MS);
    return () => clearInterval(id);
  }, [loading]);

  const validateFile = (file: File): string | null => {
    if (!(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return 'Formato no permitido. Subí una imagen (JPG/PNG) o un PDF.';
    }
    if (file.size === 0) return 'El archivo está vacío.';
    if (file.size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
      return 'El archivo supera los 10 MB.';
    }
    return null;
  };

  const processFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    setLastFileName(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await extractInvoiceDataFromFile(fd);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const mapped = mapExtractedToForm(res.data, suppliers);
      onExtracted({ ...mapped, file });
    } catch {
      toast.error('No se pudieron leer los datos de la factura.');
    } finally {
      setLoading(false);
      // Permite re-subir el mismo archivo.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const openPicker = () => {
    if (loading || disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (loading || disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (loading || disabled) return;
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-4">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={handleInputChange}
          disabled={loading || disabled}
        />

        <div
          role="button"
          tabIndex={loading || disabled ? -1 : 0}
          aria-disabled={loading || disabled}
          aria-label="Cargar datos desde una factura (PDF o imagen)"
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            dragActive ? 'border-primary bg-primary/10' : 'border-primary/30',
            loading || disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-primary hover:bg-primary/10'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-7 animate-spin text-primary" />
              <div className="w-full max-w-xs space-y-2">
                <p className="text-sm font-medium text-primary">{EXTRACTION_STAGES[stageIndex]}</p>
                {lastFileName && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate">{lastFileName}</span>
                  </p>
                )}
                {/* Barra indeterminada: un segmento que se desplaza, sin % falso. */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div className="h-full w-1/3 animate-indeterminate-progress rounded-full bg-primary" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                  <UploadCloud className="size-4 text-primary" /> Cargar desde factura
                </p>
                <p className="text-xs text-muted-foreground">
                  Arrastrá un PDF o imagen, o hacé clic para elegir. La AI completa el formulario
                  y vos revisás antes de guardar.
                </p>
                <p className="text-[11px] text-muted-foreground/80">JPG, PNG o PDF. Máx. 10 MB.</p>
              </div>
            </>
          )}
        </div>

        {/* Región para lectores de pantalla: anuncia la etapa actual. */}
        <div aria-live="polite" className="sr-only">
          {loading ? EXTRACTION_STAGES[stageIndex] : ''}
        </div>
      </CardContent>
    </Card>
  );
}
