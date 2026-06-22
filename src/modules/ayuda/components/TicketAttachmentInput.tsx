'use client';

import { Button } from '@/shared/components/ui/button';
import { FileText, ImageIcon, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(file: File) {
  if (file.type.startsWith('image/')) return ImageIcon;
  return FileText;
}

export function TicketAttachmentInput({ files, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length === 0) return;

    const accepted: File[] = [];
    let oversize = 0;
    let invalid = 0;
    for (const f of picked) {
      if (f.size > MAX_BYTES) {
        oversize += 1;
        continue;
      }
      if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) {
        invalid += 1;
        continue;
      }
      accepted.push(f);
    }
    if (oversize > 0) toast.warning(`Ignoramos ${oversize} archivo(s) que superan 10 MB.`);
    if (invalid > 0) toast.warning(`Ignoramos ${invalid} archivo(s) con formato no permitido.`);

    const merged = [...files, ...accepted].slice(0, MAX_FILES);
    if (files.length + accepted.length > MAX_FILES) {
      toast.warning(`Solo podés adjuntar ${MAX_FILES} archivos. Quedaron los primeros ${MAX_FILES}.`);
    }
    onChange(merged);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !canAddMore}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          Adjuntar archivo
        </Button>
        <span className="text-xs text-muted-foreground">
          {files.length}/{MAX_FILES} · máx. 10 MB · imagen o PDF
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handlePick}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => {
            const Icon = fileIcon(file);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  disabled={disabled}
                  onClick={() => removeAt(i)}
                  aria-label={`Quitar ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
