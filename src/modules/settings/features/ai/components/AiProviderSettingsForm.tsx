'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';

import {
  upsertAiProviderConfig,
  testAiProviderConnection,
  type AiProvider,
  type AiProviderConfigView,
} from '../actions.server';

interface Props {
  initial: AiProviderConfigView[];
}

interface ProviderMeta {
  provider: AiProvider;
  label: string;
  defaultModel: string;
  modelHint: string;
  keyHint: string;
}

const PROVIDER_META: ProviderMeta[] = [
  {
    provider: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    modelHint: 'Ej: gemini-2.5-flash. Soporta imágenes y PDF.',
    keyHint: 'Clave de Google AI Studio (Gemini API).',
  },
  {
    provider: 'openai',
    label: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    modelHint: 'Ej: gpt-4o-mini. Solo imágenes (no PDF directo).',
    keyHint: 'Clave de plataforma OpenAI (sk-...).',
  },
];

interface DraftState {
  apiKey: string;
  model: string;
}

type TestResult = { ok: boolean; message: string } | null;

export function AiProviderSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();

  const byProvider = new Map(initial.map((c) => [c.provider, c]));

  const activeFromInitial =
    initial.find((c) => c.isActive)?.provider ?? 'gemini';

  const [activeProvider, setActiveProvider] = useState<AiProvider>(activeFromInitial);

  const [drafts, setDrafts] = useState<Record<AiProvider, DraftState>>(() => {
    const base = {} as Record<AiProvider, DraftState>;
    for (const meta of PROVIDER_META) {
      const cfg = byProvider.get(meta.provider);
      base[meta.provider] = {
        apiKey: '',
        model: cfg?.model ?? meta.defaultModel,
      };
    }
    return base;
  });

  const [testing, setTesting] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    openai: false,
  });
  const [testResults, setTestResults] = useState<Record<AiProvider, TestResult>>({
    gemini: null,
    openai: null,
  });

  const setDraft = (provider: AiProvider, patch: Partial<DraftState>) =>
    setDrafts((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }));

  const handleTest = (provider: AiProvider) => {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    setTestResults((prev) => ({ ...prev, [provider]: null }));
    void (async () => {
      try {
        const result = await testAiProviderConnection(provider);
        setTestResults((prev) => ({ ...prev, [provider]: result }));
        if (result.ok) {
          toast.success('Conexión correcta', { description: result.message });
        } else {
          toast.error('Falló la conexión', { description: result.message });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error desconocido';
        setTestResults((prev) => ({ ...prev, [provider]: { ok: false, message } }));
        toast.error('Falló la conexión', { description: message });
      } finally {
        setTesting((prev) => ({ ...prev, [provider]: false }));
      }
    })();
  };

  const handleSave = () => {
    startSave(async () => {
      // Guardamos cada proveedor; el activo lleva isActive=true (exclusividad
      // la resuelve la server action). El apiKey vacío preserva la key actual.
      for (const meta of PROVIDER_META) {
        const draft = drafts[meta.provider];
        const result = await upsertAiProviderConfig({
          provider: meta.provider,
          apiKey: draft.apiKey.trim() || undefined,
          model: draft.model.trim() || undefined,
          isActive: activeProvider === meta.provider,
        });
        if (result.error) {
          toast.error('Error al guardar', {
            description: `${meta.label}: ${result.error}`,
          });
          return;
        }
      }
      toast.success('Configuración de IA guardada');
      // Limpiar los inputs de key (ya quedaron persistidos cifrados).
      setDrafts((prev) => {
        const next = { ...prev };
        for (const meta of PROVIDER_META) {
          next[meta.provider] = { ...next[meta.provider], apiKey: '' };
        }
        return next;
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proveedor activo</CardTitle>
          <CardDescription>
            Motor de IA que se usará para leer las facturas. Solo uno puede estar
            activo a la vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={activeProvider}
            onValueChange={(v) => setActiveProvider(v as AiProvider)}
            disabled={isSaving}
            aria-label="Proveedor de IA activo"
          >
            {PROVIDER_META.map((meta) => (
              <label
                key={meta.provider}
                htmlFor={`active-${meta.provider}`}
                className="flex items-center gap-3 text-sm cursor-pointer"
              >
                <RadioGroupItem value={meta.provider} id={`active-${meta.provider}`} />
                <span>{meta.label}</span>
                {byProvider.get(meta.provider)?.hasKey ? (
                  <Badge variant="secondary">Key configurada</Badge>
                ) : (
                  <Badge variant="outline">Sin key</Badge>
                )}
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {PROVIDER_META.map((meta) => {
        const cfg = byProvider.get(meta.provider);
        const draft = drafts[meta.provider];
        const result = testResults[meta.provider];
        const isTesting = testing[meta.provider];
        const keyInputId = `apikey-${meta.provider}`;
        const modelInputId = `model-${meta.provider}`;

        return (
          <Card key={meta.provider}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {meta.label}
                {activeProvider === meta.provider && (
                  <Badge variant="success">Activo</Badge>
                )}
              </CardTitle>
              <CardDescription>{meta.keyHint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={keyInputId}>API key</Label>
                <Input
                  id={keyInputId}
                  type="password"
                  autoComplete="off"
                  aria-describedby={`${keyInputId}-hint`}
                  value={draft.apiKey}
                  onChange={(e) => setDraft(meta.provider, { apiKey: e.target.value })}
                  placeholder={cfg?.hasKey ? '•••• configurada (dejar vacío para mantener)' : 'Pegá la API key'}
                  disabled={isSaving}
                />
                <p id={`${keyInputId}-hint`} className="text-xs text-muted-foreground">
                  {cfg?.hasKey
                    ? 'Ya hay una key guardada (cifrada). Dejá el campo vacío para conservarla, o pegá una nueva para reemplazarla.'
                    : 'La key se guarda cifrada. No se vuelve a mostrar.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={modelInputId}>Modelo</Label>
                <Input
                  id={modelInputId}
                  type="text"
                  aria-describedby={`${modelInputId}-hint`}
                  value={draft.model}
                  onChange={(e) => setDraft(meta.provider, { model: e.target.value })}
                  placeholder={meta.defaultModel}
                  disabled={isSaving}
                />
                <p id={`${modelInputId}-hint`} className="text-xs text-muted-foreground">
                  {meta.modelHint}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(meta.provider)}
                  disabled={isTesting || isSaving || !cfg?.hasKey}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    'Probar conexión'
                  )}
                </Button>
                {!cfg?.hasKey && (
                  <span className="text-xs text-muted-foreground">
                    Guardá una key para poder probar la conexión.
                  </span>
                )}
                {result && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      result.ok ? 'text-green-600' : 'text-destructive'
                    }`}
                    role="status"
                  >
                    {result.ok ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    {result.message}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
