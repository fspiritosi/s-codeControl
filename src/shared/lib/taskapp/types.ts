export interface TicketStatus {
  id: number;
  slug: string;
  name: string;
  color?: string;
}

export interface TicketLabel {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status_id: number;
  status?: TicketStatus;
  priority: TicketPriority;
  origin?: 'internal' | 'external';
  reporter_email: string | null;
  reporter_name: string | null;
  approver_email: string | null;
  estimated_hours: number | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  valorized_at: string | null;
  labels: TicketLabel[];
  reopen_status: 'pending' | null;
  reopen_reason: string | null;
  reopen_attachments: string[];
  reopen_requested_at: string | null;
}

export interface Comment {
  id: number;
  task_id: number;
  author_email: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  reporter_email: string;
  reporter_name?: string;
  priority: TicketPriority;
  attachments?: string[];
}

export interface CreateCommentRequest {
  body: string;
  author_email: string;
}

export interface UploadResult {
  key: string;
}

export type TaskAppRealtimeEvent =
  | { type: 'connected' }
  | { type: 'ticket.created'; id: number }
  | { type: 'ticket.updated'; id: number }
  | { type: 'comment.created'; id: number };

export interface TicketUnreadState {
  hasStatusChange: boolean;
  hasNewAgentComment: boolean;
  lastSeenAt: string | null;
}

export type TicketWithUnread = Ticket & {
  unread: TicketUnreadState;
};
