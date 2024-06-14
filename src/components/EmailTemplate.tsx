import Head from 'next/head'
import * as React from 'react'
type EmailInfo = {
  recurso: string
  document_name: string
  company_name: string
  resource_name: string
  document_number: string
}

interface EmailTemplateProps {
  userEmail: string
  reason: string
  emailInfo: EmailInfo
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  userEmail,
  reason,
  emailInfo,
}) => (
  <div>
    <html lang="es">
      <Head>
        <meta content="text/html; charset=UTF-8" />
      </Head>

      <body
        style={{
          backgroundColor: '#f3f3f5',
          fontFamily: 'HelveticaNeue, Helvetica, Arial, sans-serif',
        }}
      >
        <table
          align="center"
          width="100%"
          border={0}
          cellPadding="0"
          cellSpacing="0"
          style={{
            maxWidth: '100%',
            width: '680px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
          }}
        >
          <tbody>
            <tr style={{ width: '100%' }}>
              <td>
                <table
                  align="center"
                  width="100%"
                  border={0}
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    borderRadius: '0px 0px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#2b2d6e',
                  }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          width="100%"
                          border={0}
                          cellPadding="0"
                          cellSpacing="0"
                        >
                          <tbody style={{ width: '100%' }}>
                            <tr style={{ width: '100%' }}>
                              <td style={{ padding: '20px 30px 15px' }}>
                                <h1
                                  style={{
                                    color: '#fff',
                                    fontSize: '27px',
                                    fontWeight: 'bold',
                                    lineHeight: '27px',
                                  }}
                                >
                                  Codecontrol.com.ar
                                </h1>
                                <p
                                  style={{
                                    fontSize: '17px',
                                    lineHeight: '24px',
                                    margin: '16px 0',
                                    color: '#fff',
                                  }}
                                >
                                  Documento Rechazado
                                </p>
                              </td>
                              <td style={{ padding: '30px 10px' }}>
                                <img
                                  src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/Logo%20Juegos%20gaming%20moderno%20azul%20y%20violeta%20(4).png"
                                  style={{
                                    display: 'block',
                                    outline: 'none',
                                    border: 'none',
                                    textDecoration: 'none',
                                    maxWidth: '100%',
                                  }}
                                  width="140"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
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
                  style={{ padding: '30px 30px 40px 30px' }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <h2
                          style={{
                            margin: '0 0 15px',
                            fontWeight: 'bold',
                            fontSize: '21px',
                            lineHeight: '21px',
                            color: '#0c0d0e',
                          }}
                        >
                          Hola! nos comunicamos de Codecontrol para avisarte que
                          tienes un documento rechazado, en la bandeja de
                          notificaciones podras verlo y hacer una actualización
                          del mismo
                        </h2>

                        <hr
                          style={{
                            width: '100%',
                            border: 'none',
                            borderTop: '1px solid #eaeaea',
                            margin: '30px 0',
                          }}
                        />

                        <ul>
                          <p
                            style={{
                              fontSize: '15px',
                              lineHeight: '21px',
                              margin: '16px 0',
                              color: '#3c3f44',
                            }}
                          >
                            Compañia: {emailInfo.company_name}.
                          </p>
                          <p
                            style={{
                              fontSize: '15px',
                              lineHeight: '21px',
                              margin: '16px 0',
                              color: '#3c3f44',
                            }}
                          >
                            Recurso: {emailInfo.resource_name}.
                          </p>
                          <p
                            style={{
                              fontSize: '15px',
                              lineHeight: '21px',
                              margin: '16px 0',
                              color: '#3c3f44',
                            }}
                          >
                            Documento: {emailInfo.document_name}.
                          </p>
                          {emailInfo.document_number && (
                            <p
                              style={{
                                fontSize: '15px',
                                lineHeight: '21px',
                                margin: '16px 0',
                                color: '#3c3f44',
                              }}
                            >
                              Numero de documento: {emailInfo.document_number}.
                            </p>
                          )}
                          <p
                            style={{
                              fontSize: '15px',
                              lineHeight: '21px',
                              margin: '16px 0',
                              color: '#3c3f44',
                            }}
                          >
                            Motivo: {reason}.
                          </p>
                        </ul>

                        <hr
                          style={{
                            width: '100%',
                            border: 'none',
                            borderTop: '1px solid #eaeaea',
                            margin: '30px 0',
                          }}
                        />
                        <h2
                          style={{
                            margin: '0 0 15px',
                            fontWeight: 'bold',
                            fontSize: '21px',
                            lineHeight: '21px',
                            color: '#0c0d0e',
                          }}
                        >
                          Para ver los documentos diríjase a la app
                        </h2>
                        <table
                          align="center"
                          width="100%"
                          border={0}
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ marginTop: '24px', display: 'block' }}
                        >
                          <tbody>
                            <tr>
                              <td>
                                <a
                                  href="https://codecontrol.com.ar"
                                  style={{
                                    color: '#fff',
                                    textDecoration: 'none',
                                    backgroundColor: '#0095ff',
                                    border: '1px solid #0077cc',
                                    fontSize: '17px',
                                    lineHeight: '17px',
                                    padding: '13px 17px',
                                    borderRadius: '4px',
                                    maxWidth: '120px',
                                  }}
                                  target="_blank"
                                >
                                  ir a codecontrol.com.ar
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
  </div>
)
