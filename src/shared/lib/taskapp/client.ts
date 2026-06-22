import 'server-only';
import { Logger } from '@/shared/lib/logger';
import { TaskAppError } from './errors';
import type { Comment, CreateCommentRequest, CreateTicketRequest, Ticket, UploadResult } from './types';

const logger = new Logger('shared/lib/taskapp');

function baseURL(): string {
  const url = process.env.TASKAPP_BASE_URL;
  if (!url) throw new TaskAppError(500, 'config', 'TASKAPP_BASE_URL not set');
  return url.replace(/\/$/, '');
}

function apiKey(): string {
  const key = process.env.TASKAPP_PROJECT_API_KEY;
  if (!key) throw new TaskAppError(500, 'config', 'TASKAPP_PROJECT_API_KEY not set');
  return key;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseURL()}/api/public/v1${path}`;
  const key = apiKey();

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Key': key,
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TaskAppError) throw error;
    logger.error('taskApp network error', { data: { url, error } });
    throw new TaskAppError(0, 'network', error instanceof Error ? error.message : 'network error');
  }

  if (!res.ok) {
    const body = await res.text();
    logger.error('taskApp request failed', { data: { url, status: res.status, body } });
    throw new TaskAppError(res.status, 'http', body || res.statusText);
  }

  try {
    return (await res.json()) as T;
  } catch (error) {
    logger.error('taskApp invalid JSON', { data: { url, error } });
    throw new TaskAppError(res.status, 'parse', 'invalid JSON');
  }
}

export interface PagedTickets {
  tickets: Ticket[];
  /** Total de tickets sin paginar (header X-Total-Count). */
  total: number;
  /** Cuántos del total están en un estado completado (header X-Completed-Count). */
  completed: number;
}

export interface PageOpts {
  limit?: number;
  offset?: number;
  /** Filtro opcional por slug de estado (solo for-approver). */
  status?: string;
}

function pageQuery(opts?: PageOpts): string {
  const params = new URLSearchParams();
  if (opts?.limit && opts.limit > 0) {
    params.set('limit', String(opts.limit));
    params.set('offset', String(opts.offset ?? 0));
  }
  if (opts?.status) params.set('status', opts.status);
  const qs = params.toString();
  return qs ? `&${qs}` : '';
}

/** Como request(), pero además lee los headers de totales para paginación. */
async function requestPaged(path: string): Promise<PagedTickets> {
  const url = `${baseURL()}/api/public/v1${path}`;
  const key = apiKey();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'X-Project-Key': key },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TaskAppError) throw error;
    logger.error('taskApp network error', { data: { url, error } });
    throw new TaskAppError(0, 'network', error instanceof Error ? error.message : 'network error');
  }

  if (!res.ok) {
    const body = await res.text();
    logger.error('taskApp request failed', { data: { url, status: res.status, body } });
    throw new TaskAppError(res.status, 'http', body || res.statusText);
  }

  let tickets: Ticket[];
  try {
    tickets = (await res.json()) as Ticket[];
  } catch (error) {
    logger.error('taskApp invalid JSON', { data: { url, error } });
    throw new TaskAppError(res.status, 'parse', 'invalid JSON');
  }

  // Backends viejos no mandan los headers: degradamos al length de la página.
  const total = Number(res.headers.get('X-Total-Count') ?? tickets.length);
  const completed = Number(res.headers.get('X-Completed-Count') ?? 0);
  return { tickets, total: Number.isFinite(total) ? total : tickets.length, completed: Number.isFinite(completed) ? completed : 0 };
}

async function requestMultipart<T>(path: string, formData: FormData): Promise<T> {
  const url = `${baseURL()}${path}`;
  const key = apiKey();

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Project-Key': key },
      body: formData,
      cache: 'no-store',
    });
  } catch (error) {
    logger.error('taskApp upload network error', { data: { url, error } });
    throw new TaskAppError(0, 'network', error instanceof Error ? error.message : 'network error');
  }

  if (!res.ok) {
    const body = await res.text();
    logger.error('taskApp upload failed', { data: { url, status: res.status, body } });
    throw new TaskAppError(res.status, 'http', body || res.statusText);
  }

  try {
    return (await res.json()) as T;
  } catch (error) {
    logger.error('taskApp upload invalid JSON', { data: { url, error } });
    throw new TaskAppError(res.status, 'parse', 'invalid JSON');
  }
}

export const taskAppClient = {
  createTicket: (body: CreateTicketRequest) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(body) }),

  // Tickets del reporter, más recientes primero. Con opts.limit pagina
  // server-side y devuelve los totales en PagedTickets.
  listTicketsByReporter: (reporterEmail: string, opts?: PageOpts) =>
    requestPaged(`/tickets?reporter_email=${encodeURIComponent(reporterEmail)}${pageQuery(opts)}`),

  // Listado para un aprobador: todos los TKT externos del proyecto + los internos
  // ya valorizados, más recientes primero. Requiere que el email sea uno de los
  // aprobadores del proyecto. Soporta paginación server-side y filtro por estado.
  listTicketsForApprover: (approverEmail: string, opts?: PageOpts) =>
    requestPaged(`/tickets/for-approver?approver_email=${encodeURIComponent(approverEmail)}${pageQuery(opts)}`),

  getTicketById: (id: number) =>
    request<Ticket>(`/tickets/${id}`),

  listComments: (ticketId: number) =>
    request<Comment[]>(`/tickets/${ticketId}/comments`),

  createComment: (ticketId: number, body: CreateCommentRequest) =>
    request<Comment>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  approveTicket: (ticketId: number, approverEmail: string) =>
    request<Ticket>(`/tickets/${ticketId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver_email: approverEmail }),
    }),

  rejectTicket: (ticketId: number, approverEmail: string) =>
    request<Ticket>(`/tickets/${ticketId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approver_email: approverEmail }),
    }),

  attachToTicket: (ticketId: number, reporterEmail: string, keys: string[]) =>
    request<Ticket>(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ reporter_email: reporterEmail, keys }),
    }),

  requestTicketReopen: (
    ticketId: number,
    reporterEmail: string,
    reason: string,
    attachmentKeys: string[]
  ) =>
    request<Ticket>(`/tickets/${ticketId}/request-reopen`, {
      method: 'POST',
      body: JSON.stringify({
        reporter_email: reporterEmail,
        reason,
        attachments: attachmentKeys,
      }),
    }),

  uploadFile: (file: File, ticketId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const path =
      ticketId != null
        ? `/api/public/v1/upload?ticket_id=${ticketId}`
        : '/api/public/v1/upload';
    return requestMultipart<UploadResult>(path, formData);
  },
};
