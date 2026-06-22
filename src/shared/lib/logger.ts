/**
 * Logger liviano para debug en Next.js (cliente/servidor).
 * - Solo emite logs si `NEXT_PUBLIC_SHOW_LOGS === 'true'`
 * - Soporta niveles, agrupación (group/groupCollapsed) y helpers (table/time/separator)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogData = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

export type LogMeta = {
  /** Nombre del grupo (usa console.group/console.groupCollapsed) */
  group?: string;
  /** Si true, el group se crea colapsado */
  collapsed?: boolean;
  /** Datos adicionales (se imprimen como argumento extra) */
  data?: LogData;
};

function isLogsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LOGS === 'true';
}

function nowStamp(): string {
  try {
    return new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return new Date().toISOString();
  }
}

function prefix(level: LogLevel, scope?: string): string {
  const scopePart = scope ? `[${scope}] ` : '';
  return `[${level.toUpperCase()} ${nowStamp()}] ${scopePart}`;
}

function openGroup(name: string, collapsed?: boolean) {
  if (collapsed) console.groupCollapsed(name);
  else console.group(name);
}

function closeGroup() {
  console.groupEnd();
}

export class Logger {
  private readonly scope?: string;

  constructor(scope?: string) {
    this.scope = scope;
  }

  /** Clona el logger con un scope fijo (ideal por componente/feature) */
  withScope(scope: string) {
    return new Logger(scope);
  }

  debug(message: string, meta?: LogMeta) {
    this.emit('debug', message, meta);
  }

  info(message: string, meta?: LogMeta) {
    this.emit('info', message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.emit('warn', message, meta);
  }

  error(message: string, meta?: LogMeta) {
    this.emit('error', message, meta);
  }

  /** Agrupa un bloque completo de logs */
  group(name: string, fn: () => void, opts?: { collapsed?: boolean }) {
    if (!isLogsEnabled()) return fn();
    openGroup(`${prefix('debug', this.scope)}${name}`, opts?.collapsed ?? true);
    try {
      fn();
    } finally {
      closeGroup();
    }
  }

  table(rows: unknown[], label?: string) {
    if (!isLogsEnabled()) return;
    if (label) console.log(`${prefix('debug', this.scope)}${label}`);
    console.table(rows);
  }

  time(label: string) {
    if (!isLogsEnabled()) return;
    console.time(`${prefix('debug', this.scope)}${label}`);
  }

  timeEnd(label: string) {
    if (!isLogsEnabled()) return;
    console.timeEnd(`${prefix('debug', this.scope)}${label}`);
  }

  separator(label?: string, width = 80) {
    if (!isLogsEnabled()) return;
    const safeWidth = Math.max(10, Math.min(width, 200));
    const line = '─'.repeat(safeWidth);
    if (label) console.log(`${prefix('debug', this.scope)}${label}`);
    console.log(line);
  }

  private emit(level: LogLevel, message: string, meta?: LogMeta) {
    if (!isLogsEnabled()) return;

    const header = `${prefix(level, this.scope)}${message}`;

    if (meta?.group) {
      openGroup(`${prefix(level, this.scope)}${meta.group}`, meta.collapsed ?? true);
    }

    const data = meta?.data;
    if (typeof data === 'undefined') {
      if (level === 'warn') console.warn(header);
      else if (level === 'error') console.error(header);
      else console.log(header);
    } else {
      if (level === 'warn') console.warn(header, data);
      else if (level === 'error') console.error(header, data);
      else console.log(header, data);
    }

    if (meta?.group) closeGroup();
  }
}

/** Instancia default. Usar `logger.withScope('Nombre')` para scopes. */
export const logger = new Logger();
