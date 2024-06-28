import Head from 'next/head';
import * as React from 'react';
type EmailInfo = {
  recurso: string;
  document_name: string;
  company_name: string;
  resource_name: string;
  document_number: string;
};

interface EmailTemplateProps {
  userEmail: string;
  reason: string;
  emailInfo: EmailInfo;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ userEmail, reason, emailInfo }) => (
  <html lang="es">
    <Head>
      <meta content="text/html; charset=UTF-8" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
    </Head>

    <body style={{ backgroundColor: '#f3f3f5', fontFamily: 'Poppins, sans-serif' }}>
      <table
        align="center"
        width="100%"
        border={0}
        cellPadding="0"
        cellSpacing="0"
        style={{ maxWidth: '680px', margin: '0 auto' }}
      >
        <tbody>
          <tr>
            <td>
              <table
                width="100%"
                border={0}
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem 0.5rem 0 0',
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: '30px' }}>
                      <h1
                        style={{
                          color: '#2b2d6e',
                          fontSize: '32px',
                          fontWeight: '700',
                          lineHeight: '36px',
                          marginBottom: '16px',
                        }}
                      >
                        Codecontrol
                      </h1>
                      <p
                        style={{
                          fontSize: '20px',
                          lineHeight: '28px',
                          color: '#6b7280',
                        }}
                      >
                        Notificación de Documento
                      </p>
                    </td>
                    <td style={{ padding: '30px' }}>
                      <img
                        src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png"
                        style={{ display: 'block', maxWidth: '100%' }}
                        width="140"
                        alt="logo codecontrol"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <table
                width="100%"
                border={0}
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: '#fff',
                  padding: '40px',
                  borderRadius: '0 0 0.5rem 0.5rem',
                }}
              >
                <tbody>
                  <tr>
                    <td>
                      <h2
                        style={{
                          margin: '0 0 20px',
                          fontWeight: '700',
                          fontSize: '24px',
                          lineHeight: '28px',
                          color: '#2b2d6e',
                        }}
                      >
                        ¡Importante! Tenemos una actualización sobre tu documentación.
                      </h2>
                      <p
                        style={{
                          fontSize: '16px',
                          lineHeight: '24px',
                          color: '#6b7280',
                          marginBottom: '30px',
                        }}
                      >
                        Hemos detectado que uno de tus documentos ha sido rechazado y requiere tu atención inmediata.
                        Por favor, revisa los detalles a continuación y realiza las acciones necesarias en tu bandeja de
                        notificaciones.
                      </p>
                      <table
                        width="100%"
                        border={0}
                        cellPadding="0"
                        cellSpacing="0"
                        style={{
                          borderCollapse: 'separate',
                          borderSpacing: '10px',
                        }}
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                backgroundColor: '#f8fafc',
                                padding: '30px',
                                borderRadius: '0.5rem',
                                border: '1px solid #e0e0e0',
                              }}
                            >
                              <h3
                                style={{
                                  margin: '0 0 20px',
                                  fontWeight: '700',
                                  fontSize: '18px',
                                  lineHeight: '24px',
                                  color: '#2b2d6e',
                                }}
                              >
                                Detalles del Documento Rechazado
                              </h3>
                              <p
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '24px',
                                  color: '#6b7280',
                                  marginBottom: '10px',
                                }}
                              >
                                <strong>Compañía:</strong> {emailInfo.company_name}
                              </p>
                              <p
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '24px',
                                  color: '#6b7280',
                                  marginBottom: '10px',
                                }}
                              >
                                <strong>Recurso:</strong> {emailInfo.resource_name}
                              </p>
                              <p
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '24px',
                                  color: '#6b7280',
                                  marginBottom: '10px',
                                }}
                              >
                                <strong>Documento:</strong> {emailInfo.document_name}
                              </p>
                              {emailInfo.document_number && (
                                <p
                                  style={{
                                    fontSize: '16px',
                                    lineHeight: '24px',
                                    color: '#6b7280',
                                    marginBottom: '10px',
                                  }}
                                >
                                  <strong>Número de Documento:</strong> {emailInfo.document_number}
                                </p>
                              )}
                              <p
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '24px',
                                  color: '#6b7280',
                                }}
                              >
                                <strong>Motivo:</strong> {reason}
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <table
                        align="center"
                        width="100%"
                        border={0}
                        cellPadding="0"
                        cellSpacing="0"
                        style={{ marginTop: '30px' }}
                      >
                        <tbody>
                          <tr>
                            <td>
                              <a
                                href="https://codecontrol.com.ar/dashboard"
                                style={{
                                  color: '#fff',
                                  textDecoration: 'none',
                                  backgroundColor: '#2b2d6e',
                                  fontSize: '16px',
                                  lineHeight: '20px',
                                  padding: '12px 20px',
                                  borderRadius: '0.5rem',
                                  display: 'inline-block',
                                }}
                                target="_blank"
                              >
                                Ir a Codecontrol
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
);
