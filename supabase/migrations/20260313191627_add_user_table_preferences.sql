-- Tabla para persistir preferencias de DataTable por usuario.
-- Almacena visibilidad de columnas y filtros por tabla.

CREATE TABLE IF NOT EXISTS public.user_table_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_id text NOT NULL,
  column_visibility jsonb DEFAULT '{}'::jsonb,
  filter_visibility jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, table_id)
);

-- RLS
ALTER TABLE public.user_table_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.user_table_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_table_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_table_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_table_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_user_table_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_table_preferences_updated_at
  BEFORE UPDATE ON public.user_table_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_table_preferences_updated_at();
