import Head from 'next/head';
import * as React from 'react';

interface EmailTemplateHelpProps {
  userEmail: string;
  reason: string;
}

export const EmailTemplateHelp: React.FC<Readonly<EmailTemplateHelpProps>> = ({ userEmail, reason }) => (
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
                        <table align="center" width="100%" border={0} cellPadding="0" cellSpacing="0">
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
                                  Centro de Ayuda
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
                                  alt="logo codeControl"
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
                          Usuario: {userEmail}!
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
                              <td></td>
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
);
