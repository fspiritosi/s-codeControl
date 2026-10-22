-- Bucket de Storage para los PDFs del módulo de costos (composiciones y recibos).
-- Privado: el acceso se hace siempre vía URL firmada (getSignedUrlPDF).
insert into storage.buckets (id, name, public)
values ('costos-pdfs', 'costos-pdfs', false)
on conflict (id) do nothing;
