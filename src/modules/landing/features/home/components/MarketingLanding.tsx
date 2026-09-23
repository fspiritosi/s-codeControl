'use client';

import { useState, type FormEvent } from 'react';
import styles from './MarketingLanding.module.css';

const CONTACT_EMAIL = 'ventas@codecontrol.com.ar';
const benefits = [
  ['Información en un solo lugar', 'Documentos organizados y datos disponibles para quienes los necesitan.'],
  ['Personas y equipos conectados', 'Un mismo punto de referencia para coordinar tareas, recursos y mantenimiento.'],
  ['Más claridad para decidir', 'Información organizada para dar seguimiento a los procesos de tu empresa.'],
];

export default function MarketingLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [interest, setInterest] = useState('Software a medida');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setFeedback({ ok: response.ok, message: result.message || 'No pudimos confirmar el envío. Intentá nuevamente.' });
      if (response.ok) {
        form.reset();
        setInterest('Software a medida');
      }
    } catch {
      setFeedback({
        ok: false,
        message:
          'No pudimos confirmar el envío. Conservamos tus datos para que puedas reintentar o escribirnos a ventas@codecontrol.com.ar.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className={styles.landing}>
      <a className={styles['skip']} href="#principal">
        Saltar al contenido
      </a>
      <header>
        <div className={styles['wrap'] + ' ' + styles['nav']}>
          <a className={styles['brand']} href="#principal" aria-label="CodeControl, inicio">
            code<span>control</span>
          </a>
          <button
            className={styles['menu']}
            aria-controls="navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menú
          </button>
          <nav
            className={menuOpen ? styles.open : undefined}
            onClick={() => setMenuOpen(false)}
            id="navigation"
            aria-label="Principal"
          >
            <a href="#soluciones">Qué resolvemos</a>
            <a href="#productos">Productos</a>
            <a href="#proceso">Cómo trabajamos</a>
            <a href="/login">Ingresar</a>
            <a className={styles['nav-cta']} href="#contacto">
              Coordinemos una llamada
            </a>
          </nav>
        </div>
      </header>
      <div id="principal">
        <section className={styles['wrap'] + ' ' + styles['hero']}>
          <div>
            <p className={styles['intro']}>Software para trabajar mejor</p>
            <h1>
              Menos tareas manuales.
              <br />
              Más control de tu empresa.
            </h1>
            <p className={styles['lead']}>
              Conectamos tus procesos, tu equipo y tu información con software a medida y soluciones de gestión.
            </p>
            <div className={styles['actions']}>
              <a className={styles['button']} href="#contacto">
                Coordinemos una llamada
              </a>
              <a className={styles['button'] + ' ' + styles['secondary']} href="#productos">
                Explorar productos
              </a>
            </div>
            <p className={styles['note']}>Contanos cómo trabajás. Empecemos por lo que necesitás resolver.</p>
          </div>
          <div className={styles['flow']} aria-label="Ejemplo conceptual de procesos conectados">
            <div className={styles['flow-top']}>
              <span>De la información dispersa al control</span>
              <span>Así lo conectamos</span>
            </div>
            <h2>Todo empieza a trabajar junto.</h2>
            <div className={styles['flow-inputs']}>
              <div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M4 9h16M4 15h16M10 9v12" />
                </svg>
                Planillas
              </div>
              <div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h16v13H9l-5 4zM8 8h8M8 12h5" />
                </svg>
                Mensajes
              </div>
              <div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8" />
                </svg>
                Documentos
              </div>
            </div>
            <div className={styles['connect']} aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div className={styles['hub']}>
              codecontrol
              <small>
                Una solución
                <br />
                para tu operación
              </small>
            </div>
            <div className={styles['connector']} aria-hidden="true"></div>
            <div className={styles['flow-output']} aria-live="polite">
              <strong id="flow-title">{benefits[activeBenefit][0]}</strong>
              <p id="flow-description">{benefits[activeBenefit][1]}</p>
            </div>
            <div className={styles['flow-tabs']} role="group" aria-label="Explorar beneficios">
              <button aria-pressed={activeBenefit === 0} onClick={() => setActiveBenefit(0)}>
                Información
              </button>
              <button aria-pressed={activeBenefit === 1} onClick={() => setActiveBenefit(1)}>
                Operación
              </button>
              <button aria-pressed={activeBenefit === 2} onClick={() => setActiveBenefit(2)}>
                Gestión
              </button>
            </div>
          </div>
        </section>
        <div className={styles['wrap'] + ' ' + styles['audience']}>
          <strong>Para empresas que quieren trabajar mejor.</strong>
          <span>Servicios</span>
          <span>Comercio y distribución</span>
          <span>Construcción</span>
          <span>Operaciones y mantenimiento</span>
        </div>
        <section className={styles['wrap'] + ' ' + styles['section']} id="soluciones">
          <div className={styles['section-head']}>
            <h2>
              Cuando el proceso
              <br />
              te queda chico.
            </h2>
            <p>
              Una tarea repetida, información que no aparece o herramientas desconectadas. Buscamos el punto donde el
              software puede hacer más simple tu trabajo.
            </p>
          </div>
          <div className={styles['services']}>
            <article className={styles['service']}>
              <div className={styles['service-symbol']} aria-hidden="true">
                ↻
              </div>
              <h3>Dejá de cargar todo dos veces.</h3>
              <p>
                Conectá herramientas y automatizá tareas repetitivas para que la información siga el recorrido de tu
                trabajo.
              </p>
              <small>Integraciones y automatización de procesos</small>
            </article>
            <article className={styles['service']}>
              <div className={styles['service-symbol']} aria-hidden="true">
                ⌘
              </div>
              <h3>Encontrá lo que necesitás.</h3>
              <p>
                Reuní documentos, personas y equipos en un mismo lugar, con una estructura pensada para tu operación.
              </p>
              <small>Gestión documental y operativa</small>
            </article>
            <article className={styles['service']}>
              <div className={styles['service-symbol']} aria-hidden="true">
                ⌁
              </div>
              <h3>Trabajá con tu propia lógica.</h3>
              <p>
                Si tu proceso necesita algo específico, diseñamos una aplicación web o móvil a la medida de tu empresa.
              </p>
              <small>Desarrollo de software a medida</small>
            </article>
          </div>
        </section>
        <section className={styles['products-bg']} id="productos">
          <div className={styles['wrap'] + ' ' + styles['section']}>
            <div className={styles['section-head']}>
              <h2>
                Una solución para
                <br />
                cada forma de trabajar.
              </h2>
              <p>
                Podés empezar con uno de nuestros productos o conversar sobre un desarrollo específico para tu empresa.
              </p>
            </div>
            <article className={styles['product']}>
              <div>
                <span className={styles['tag']}>Gestión operativa</span>
                <h3>
                  Tu gente y tus equipos,
                  <br />
                  mejor coordinados.
                </h3>
                <p>Centralizá la información que sostiene tu operación y facilitá el seguimiento del trabajo diario.</p>
                <ul>
                  <li>Empleados, equipos y documentación</li>
                  <li>Mantenimiento de vehículos y maquinaria</li>
                  <li>Planificación y gestión de operaciones</li>
                </ul>
                <a
                  className={styles['button']}
                  href="#contacto"
                  onClick={() => {
                    setInterest('Gestión operativa');
                    setFeedback(null);
                  }}
                >
                  Solicitar una demo
                </a>
              </div>
              <div className={styles['module-list']}>
                <div className={styles['product-name']}>CodeControl</div>
                <p>Áreas de gestión conectadas</p>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">◎</span>
                  <div>
                    Personas y equipos<small>Información de tus recursos</small>
                  </div>
                </div>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">▤</span>
                  <div>
                    Documentación<small>Archivos organizados y accesibles</small>
                  </div>
                </div>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">↻</span>
                  <div>
                    Mantenimiento<small>Seguimiento de equipos y vehículos</small>
                  </div>
                </div>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">⌘</span>
                  <div>
                    Operaciones<small>Coordinación del trabajo diario</small>
                  </div>
                </div>
              </div>
            </article>
            <article className={styles['product'] + ' ' + styles['green']}>
              <div>
                <span className={styles['tag']}>Gestión comercial</span>
                <h3>PyME Suite</h3>
                <p>
                  Tu negocio, bajo control. Reuní la gestión comercial en un sistema en la nube, accesible desde tus
                  dispositivos.
                </p>
                <ul>
                  <li>Stock, compras y facturación</li>
                  <li>Clientes y cuentas corrientes</li>
                  <li>Caja y reportes del negocio</li>
                </ul>
                <a className={styles['button']} href="https://www.pymesuites.com/" target="_blank" rel="noopener">
                  Conocer PyME Suite
                </a>
              </div>
              <div className={styles['module-list']}>
                <div className={styles['product-name']}>PyME Suite</div>
                <p>La información de tu negocio, conectada</p>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">▦</span>
                  <div>
                    Stock y compras<small>Inventario y movimientos de productos</small>
                  </div>
                </div>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">▤</span>
                  <div>
                    Facturación y clientes<small>Comprobantes e historial comercial</small>
                  </div>
                </div>
                <div className={styles['module-row']}>
                  <span aria-hidden="true">≋</span>
                  <div>
                    Caja y reportes<small>Información para tomar decisiones</small>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className={styles['wrap'] + ' ' + styles['section']} id="proceso">
          <div className={styles['section-head']}>
            <h2>
              Primero entendemos.
              <br />
              Después desarrollamos.
            </h2>
            <p>
              La tecnología tiene sentido cuando responde a una necesidad concreta. Por eso empezamos por tu forma de
              trabajar.
            </p>
          </div>
          <div className={styles['steps']}>
            <article>
              <div className={styles['step-number']}>1</div>
              <h3>Hablemos de tu operación.</h3>
              <p>Revisamos qué hacés hoy, con qué herramientas y dónde aparecen las dificultades.</p>
            </article>
            <article>
              <div className={styles['step-number']}>2</div>
              <h3>Definamos el camino.</h3>
              <p>Evaluamos un producto existente o una solución a medida, con un alcance claro.</p>
            </article>
            <article>
              <div className={styles['step-number']}>3</div>
              <h3>Pongámoslo en marcha.</h3>
              <p>Implementamos la solución y acompañamos su uso, con espacio para seguir mejorando.</p>
            </article>
          </div>
        </section>
        <section className={styles['contact-section']} id="contacto">
          <div className={styles['wrap'] + ' ' + styles['contact-grid']}>
            <div>
              <h2>¿Qué proceso te gustaría simplificar?</h2>
              <p>
                Contanos qué necesita tu empresa. Coordinemos una llamada para evaluar una solución o una demo de
                nuestros productos.
              </p>
              <a className={styles['email']} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className={styles['contact-form']}>
              <h3>Empecemos por una conversación.</h3>
              <form id="contact-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting}>
                  <div className={styles.honeypot} aria-hidden="true">
                    <label>
                      Sitio web
                      <input name="website" autoComplete="off" tabIndex={-1} />
                    </label>
                  </div>
                  <div className={styles['fields']}>
                    <label className={styles['field']}>
                      Tu nombre
                      <input name="nombre" autoComplete="name" maxLength={120} required />
                    </label>
                    <label className={styles['field']}>
                      Empresa
                      <input name="empresa" autoComplete="organization" maxLength={120} required />
                    </label>
                    <label className={styles['field'] + ' ' + styles['wide']}>
                      Email de contacto
                      <input name="email" type="email" autoComplete="email" maxLength={254} required />
                    </label>
                    <label className={styles['field'] + ' ' + styles['wide']}>
                      ¿Sobre qué querés conversar?
                      <select
                        name="interes"
                        id="interest"
                        value={interest}
                        onChange={(event) => setInterest(event.target.value)}
                      >
                        <option>Software a medida</option>
                        <option>Gestión operativa</option>
                        <option>PyME Suite</option>
                        <option>Necesito orientación</option>
                      </select>
                    </label>
                    <label className={styles['field'] + ' ' + styles['wide']}>
                      Contanos brevemente
                      <textarea
                        name="mensaje"
                        minLength={10}
                        maxLength={4000}
                        placeholder="Por ejemplo: queremos centralizar la documentación de nuestros equipos."
                        required
                      ></textarea>
                    </label>
                  </div>
                  <button className={styles['button']} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando consulta…' : 'Enviar consulta'}
                  </button>
                </fieldset>
                <p className={styles['note']}>Usaremos tus datos para responder a esta consulta.</p>
              </form>
              <div className={styles['email-draft']} role="status" aria-live="polite" hidden={!feedback}>
                <p>{feedback?.message}</p>
                {feedback && !feedback.ok && <a href={`mailto:${CONTACT_EMAIL}`}>Escribir directamente a ventas</a>}
              </div>
            </div>
          </div>
        </section>
      </div>
      <footer>
        <div className={styles['wrap'] + ' ' + styles['footer-row']}>
          <a className={styles['brand']} href="#principal">
            code<span>control</span>
          </a>
          <p>Software a medida y soluciones de gestión.</p>
          <a href={`mailto:${CONTACT_EMAIL}`}>Hablemos de tu proyecto</a>
        </div>
      </footer>
    </div>
  );
}
