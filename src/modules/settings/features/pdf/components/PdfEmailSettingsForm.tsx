'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  removePdfEmailSetting,
  upsertPdfEmailSetting,
} from '../actions.server';
import { EMAILABLE_PDF_KEYS, type PdfEmailSetting } from '../types';

interface Props {
  initial: PdfEmailSetting[];
  companyContactEmail: string | null;
}

interface RowState {
  pdf_key: string;
  label: string;
  from_email: string;
  from_name: string;
  hasOverride: boolean;
}

export function PdfEmailSettingsForm({ initial, companyContactEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<RowState[]>(() =>
    EMAILABLE_PDF_KEYS.map(({ key, label }) => {
      const found = initial.find((i) => i.pdf_key === key);
      return {
        pdf_key: key,
        label,
        from_email: found?.from_email ?? '',
        from_name: found?.from_name ?? '',
        hasOverride: !!found,
      };
    })
  );

  const updateRow = (key: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.pdf_key === key ? { ...r, ...patch } : r)));
  };

  const handleSave = (row: RowState) => {
    if (!row.from_email.trim()) {
      toast.error('Ingresá un email');
      return;
    }
    startTransition(async () => {
      const r = await upsertPdfEmailSetting({
        pdf_key: row.pdf_key,
        from_email: row.from_email,
        from_name: row.from_name || null,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Configuración guardada');
      updateRow(row.pdf_key, { hasOverride: true });
      router.refresh();
    });
  };

  const handleRemove = (row: RowState) => {
    startTransition(async () => {
      const r = await removePdfEmailSetting(row.pdf_key);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Configuración eliminada');
      updateRow(row.pdf_key, { from_email: '', from_name: '', hasOverride: false });
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emails de respuesta por PDF</CardTitle>
        <CardDescription>
          Para cada tipo de PDF podés configurar un email de respuesta y un nombre visible.
          Cuando el destinatario responda, el correo va a este email. Si no configurás uno,
          se usa el email de contacto de la empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.map((row) => (
          <div key={row.pdf_key} className="grid gap-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{row.label}</h4>
                <p className="text-xs text-muted-foreground">
                  {row.hasOverride
                    ? `Reply-To: ${row.from_email}`
                    : `Reply-To por defecto: ${companyContactEmail ?? 'sin email de empresa'}`}
                </p>
              </div>
              {row.hasOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(row)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4 mr-1 text-destructive" />
                  Quitar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-end">
              <div className="grid gap-1.5">
                <Label htmlFor={`email-${row.pdf_key}`}>Email</Label>
                <Input
                  id={`email-${row.pdf_key}`}
                  type="email"
                  placeholder="ej: compras@empresa.com"
                  value={row.from_email}
                  onChange={(e) => updateRow(row.pdf_key, { from_email: e.target.value })}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`name-${row.pdf_key}`}>Nombre (opcional)</Label>
                <Input
                  id={`name-${row.pdf_key}`}
                  placeholder="ej: Compras"
                  value={row.from_name}
                  onChange={(e) => updateRow(row.pdf_key, { from_name: e.target.value })}
                  disabled={isPending}
                />
              </div>
              <Button onClick={() => handleSave(row)} disabled={isPending}>
                <Save className="size-4 mr-1" />
                Guardar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
