import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Wrench } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/es';
import type { Comment } from '@/shared/lib/taskapp/types';

interface Props {
  comment: Comment;
  currentUserEmail: string;
  currentUserName: string;
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  // Si parece email, tomar la parte antes del @ y separar por puntos
  const source = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  return letters || trimmed[0]?.toUpperCase() || '';
}

export function TicketCommentItem({ comment, currentUserEmail, currentUserName }: Props) {
  const isMine = comment.author_email === currentUserEmail;
  const displayName = isMine ? currentUserName : 'Soporte';
  const isOptimistic = comment.id < 0;
  const myInitials = initialsFromName(currentUserName);

  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isMine
              ? 'text-xs'
              : 'bg-primary/10 text-primary'
          }
        >
          {isMine ? myInitials : <Wrench className="h-4 w-4" aria-label="Soporte" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[80%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}
      >
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isMine ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'
          } ${isOptimistic ? 'opacity-60' : ''}`}
        >
          <p className="whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div
          className={`flex items-center gap-2 text-[11px] text-muted-foreground ${isMine ? 'justify-end' : ''}`}
        >
          <span>{displayName}</span>
          <span aria-hidden>·</span>
          <time dateTime={comment.created_at}>
            {moment(comment.created_at).locale('es').fromNow()}
          </time>
        </div>
      </div>
    </div>
  );
}
