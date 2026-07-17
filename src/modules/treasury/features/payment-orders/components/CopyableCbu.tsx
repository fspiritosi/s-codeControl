'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/** Formatea un CBU de 22 dígitos en grupos de 4 para lectura. */
export function formatCbu(cbu: string | null | undefined): string {
  if (!cbu) return '—';
  const clean = cbu.trim();
  if (clean.length === 0) return '—';
  if (clean.length !== 22) return clean;
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}

interface Props {
  cbu: string;
}

/** Muestra el CBU completo (visible) con un botón para copiarlo al portapapeles. */
export function CopyableCbu({ cbu }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const value = cbu.trim();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('CBU copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el CBU');
    }
  };

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="font-mono text-foreground">{formatCbu(cbu)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5"
        onClick={handleCopy}
        title="Copiar CBU"
        aria-label="Copiar CBU"
      >
        {copied ? (
          <Check className="size-3 text-green-600" />
        ) : (
          <Copy className="size-3" />
        )}
      </Button>
    </span>
  );
}
