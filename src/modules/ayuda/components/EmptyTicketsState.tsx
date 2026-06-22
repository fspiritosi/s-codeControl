import { Inbox } from 'lucide-react';

export function EmptyTicketsState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center text-center px-6 py-10">
      <div className="relative mb-4">
        <span
          aria-hidden
          className="absolute inset-0 -m-3 rounded-full bg-primary/10 blur-xl"
        />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
          <Inbox className="h-7 w-7" strokeWidth={1.75} />
        </span>
      </div>
      <h3 className="text-base font-medium tracking-tight">Todavía no enviaste ningún reporte</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[28ch]">
        Cuando lo hagas, vas a verlo acá con su estado actualizado.
      </p>
    </div>
  );
}
