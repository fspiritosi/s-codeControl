'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadSupportTicketAttachment } from '../actions/support-attachments';

interface UploadParams {
  file: File;
  /** Si el ticket ya existe, el archivo se guarda dentro de la carpeta del ticket. */
  ticketId?: number;
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async ({ file, ticketId }: UploadParams) => {
      const fd = new FormData();
      fd.append('file', file);
      if (ticketId != null) fd.append('ticket_id', String(ticketId));
      return uploadSupportTicketAttachment(fd);
    },
  });
}
