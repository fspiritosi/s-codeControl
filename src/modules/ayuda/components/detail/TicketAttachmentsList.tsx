import { FileText, ImageIcon, Paperclip } from 'lucide-react';

interface Props {
  urls: string[];
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').pop() || url;
    return decodeURIComponent(last);
  } catch {
    return url;
  }
}

function isImage(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return /\.(png|jpg|jpeg|gif|webp)$/i.test(pathname);
  } catch {
    return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
  }
}

export function TicketAttachmentsList({ urls }: Props) {
  if (urls.length === 0) return null;
  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        Adjuntos ({urls.length})
      </h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, i) => {
          const name = fileNameFromUrl(url);
          const image = isImage(url);
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-md border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted"
              title={name}
            >
              {image ? (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                {image ? (
                  <ImageIcon className="h-3 w-3 shrink-0" />
                ) : (
                  <FileText className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{name}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
