'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LinkedRecordItem {
  label: string;
  detail?: string;
  status?: string;
  statusVariant?: 'default' | 'outline' | 'destructive' | 'secondary';
}

export interface LinkedRecordGroup {
  key: string;
  label: string;
  icon?: LucideIcon;
  items: LinkedRecordItem[];
}

interface PDFOptionsDialogProps {
  documentLabel: string;
  pdfUrl: string;
  linkedGroups: LinkedRecordGroup[];
  trigger?: ReactNode;
}

export function PDFOptionsDialog({
  documentLabel,
  pdfUrl,
  linkedGroups,
  trigger,
}: PDFOptionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const groupsWithItems = linkedGroups.filter((g) => g.items.length > 0);

  const handleToggleGroup = (key: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === groupsWithItems.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groupsWithItems.map((g) => g.key)));
    }
  };

  const handleDownload = () => {
    const url = new URL(pdfUrl, window.location.origin);
    if (selectedGroups.size > 0) {
      url.searchParams.set('include', Array.from(selectedGroups).join(','));
    }
    window.open(url.toString(), '_blank');
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedGroups(new Set());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Descargar PDF
          </DialogTitle>
          <DialogDescription>{documentLabel}</DialogDescription>
        </DialogHeader>

        {groupsWithItems.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Incluir documentos vinculados:
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedGroups.size === groupsWithItems.length
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </Button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto">
              {groupsWithItems.map((group) => {
                const Icon = group.icon || FileText;
                const isSelected = selectedGroups.has(group.key);

                return (
                  <div
                    key={group.key}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleGroup(group.key)}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {group.label}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {group.items.length}
                      </Badge>
                    </label>

                    {isSelected && (
                      <div className="ml-7 space-y-1.5 pt-1">
                        {group.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono truncate">
                                {item.label}
                              </span>
                              {item.status && (
                                <Badge
                                  variant={item.statusVariant || 'outline'}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            {item.detail && (
                              <span className="font-mono whitespace-nowrap ml-2">
                                {item.detail}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin documentos vinculados
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            {selectedGroups.size > 0
              ? `Descargar con ${selectedGroups.size} adjunto${selectedGroups.size > 1 ? 's' : ''}`
              : 'Descargar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
