/**
 * Utilidades para que un formulario que falla la validación no quede en silencio.
 *
 * react-hook-form enfoca el primer campo con error, pero solo si ese campo es un
 * input nativo. Los controles construidos sobre Radix (RadioGroup, Select) son
 * botones/divs sin ref enfocable, así que no reciben foco y la pantalla no se
 * mueve: el usuario toca "Guardar", no pasa nada visible y cree que la app se
 * colgó. Estas funciones cubren ese hueco.
 */

/**
 * Cuenta los campos con error, incluidos los agrupados por sección
 * (ej. `errors.luces['Luces Altas']` en el checklist semanal).
 */
export function countFieldErrors(errors: unknown): number {
  if (!errors || typeof errors !== 'object') return 0;

  const node = errors as Record<string, unknown>;
  // Hoja: react-hook-form deja `message`/`type` en el error de cada campo.
  if (typeof node.message === 'string' || typeof node.type === 'string') return 1;

  return Object.values(node).reduce<number>((total, value) => total + countFieldErrors(value), 0);
}

/**
 * Lleva la vista al primer control inválido del formulario y lo enfoca.
 *
 * Ancla en `aria-invalid="true"` (que `FormControl` ya pone en el control) y cae
 * al mensaje de error (`*-form-item-message`) para los controles que no lo
 * propagan. `querySelector` con selector múltiple devuelve el primero en orden
 * de documento, que es el que el usuario percibe como "el primero".
 */
export function scrollToFirstInvalidField(container?: HTMLElement | null): void {
  if (typeof document === 'undefined') return;

  const root: ParentNode = container ?? document;
  const target = root.querySelector<HTMLElement>('[aria-invalid="true"], [id$="-form-item-message"]');
  if (!target) return;

  target.scrollIntoView({ behavior: resolveScrollBehavior(target), block: 'center' });

  // `preventScroll` evita que el foco haga un salto brusco y pise el scroll suave.
  const focusable = isFocusable(target) ? target : target.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  focusable?.focus({ preventScroll: true });
}

/**
 * Elige entre salto instantáneo y desplazamiento animado.
 *
 * `globals.css` define `html { scroll-behavior: smooth }`, así que pasar
 * `'auto'` NO desactiva la animación: por spec, `'auto'` usa el
 * `scroll-behavior` computado del elemento. El único valor que fuerza el salto
 * es `'instant'`.
 *
 * Se salta instantáneo en dos casos: cuando el usuario pidió menos movimiento,
 * y cuando el campo está lejos — la duración del scroll suave la fija el
 * navegador y crece con la distancia, así que en un checklist de 18 preguntas
 * el recorrido se siente lento y puede marear.
 */
function resolveScrollBehavior(target: HTMLElement): ScrollBehavior {
  const prefiereMenosMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (prefiereMenosMovimiento) return 'instant';

  const distancia = Math.abs(target.getBoundingClientRect().top - window.innerHeight / 2);
  return distancia > window.innerHeight * 2 ? 'instant' : 'smooth';
}

const FOCUSABLE_SELECTOR = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';

function isFocusable(element: HTMLElement): boolean {
  return element.matches(FOCUSABLE_SELECTOR);
}

/**
 * Mensaje para el toast que acompaña al scroll.
 */
export function missingFieldsMessage(errors: unknown): string {
  const total = countFieldErrors(errors);
  return total === 1
    ? 'Falta completar 1 campo obligatorio'
    : `Faltan completar ${total} campos obligatorios`;
}

/**
 * Normaliza el kilometraje tipeado a mano.
 *
 * En el celular es habitual escribirlo con separador de miles ("49.900"), y
 * `Number('49.900')` da 49,9: el valor queda por debajo del kilometraje del
 * equipo y el guardado se bloquea sin explicación. Acá se limpian espacios y
 * separadores de miles, y se rechaza explícitamente lo que no sea un número.
 */
export function parseKilometraje(value: string): { value: number; normalized: string } | { error: string } {
  const raw = (value ?? '').trim();
  if (!raw) return { error: 'El kilometraje es requerido' };

  // Separadores de miles: puntos o comas seguidos de exactamente 3 dígitos.
  const withoutThousandSeparators = raw.replace(/\s/g, '').replace(/[.,](?=\d{3}\b)/g, '');

  if (!/^\d+$/.test(withoutThousandSeparators)) {
    return { error: 'Ingresá el kilometraje solo con números, sin puntos ni comas' };
  }

  return { value: Number(withoutThousandSeparators), normalized: withoutThousandSeparators };
}
