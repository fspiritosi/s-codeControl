// import Head from 'next/head';
// import * as React from 'react';

// interface EmailTemplateHelpProps {
//   userEmail: string;
//   reason?: string;
// }

// export const EmailTemplateHelp: React.FC<Readonly<EmailTemplateHelpProps>> = ({ userEmail, reason }) => (
//   <div>
//     <html lang="es">
//       <Head>
//         <meta content="text/html; charset=UTF-8" />
//       </Head>

//       <body
//         style={{
//           backgroundColor: '#f3f3f5',
//           fontFamily: 'HelveticaNeue, Helvetica, Arial, sans-serif',
//         }}
//       >
//         <table
//           align="center"
//           width="100%"
//           border={0}
//           cellPadding="0"
//           cellSpacing="0"
//           style={{
//             maxWidth: '100%',
//             width: '680px',
//             margin: '0 auto',
//             backgroundColor: '#ffffff',
//           }}
//         >
//           <tbody>
//             <tr style={{ width: '100%' }}>
//               <td>
//                 <table
//                   align="center"
//                   width="100%"
//                   border={0}
//                   cellPadding="0"
//                   cellSpacing="0"
//                   style={{
//                     borderRadius: '0px 0px 0 0',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     backgroundColor: '#2b2d6e',
//                   }}
//                 >
//                   <tbody>
//                     <tr>
//                       <td>
//                         <table align="center" width="100%" border={0} cellPadding="0" cellSpacing="0">
//                           <tbody style={{ width: '100%' }}>
//                             <tr style={{ width: '100%' }}>
//                               <td style={{ padding: '20px 30px 15px' }}>
//                                 <h1
//                                   style={{
//                                     color: '#fff',
//                                     fontSize: '27px',
//                                     fontWeight: 'bold',
//                                     lineHeight: '27px',
//                                   }}
//                                 >
//                                   Codecontrol.com.ar
//                                 </h1>
//                                 <p
//                                   style={{
//                                     fontSize: '17px',
//                                     lineHeight: '24px',
//                                     margin: '16px 0',
//                                     color: '#fff',
//                                   }}
//                                 >
//                                   Centro de Ayuda
//                                 </p>
//                               </td>
//                               <td style={{ padding: '30px 10px' }}>
//                                 <img
//                                   src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/Logo%20Juegos%20gaming%20moderno%20azul%20y%20violeta%20(4).png"
//                                   style={{
//                                     display: 'block',
//                                     outline: 'none',
//                                     border: 'none',
//                                     textDecoration: 'none',
//                                     maxWidth: '100%',
//                                   }}
//                                   width="140"
//                                   alt="logo codeControl"
//                                 />
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//                 <table
//                   align="center"
//                   width="100%"
//                   border={0}
//                   cellPadding="0"
//                   cellSpacing="0"
//                   style={{ padding: '30px 30px 40px 30px' }}
//                 >
//                   <tbody>
//                     <tr>
//                       <td>
//                         <h2
//                           style={{
//                             margin: '0 0 15px',
//                             fontWeight: 'bold',
//                             fontSize: '21px',
//                             lineHeight: '21px',
//                             color: '#0c0d0e',
//                           }}
//                         >
//                           Usuario: {userEmail}!
//                         </h2>

//                         <hr
//                           style={{
//                             width: '100%',
//                             border: 'none',
//                             borderTop: '1px solid #eaeaea',
//                             margin: '30px 0',
//                           }}
//                         />

//                         <ul>
//                           <p
//                             style={{
//                               fontSize: '15px',
//                               lineHeight: '21px',
//                               margin: '16px 0',
//                               color: '#3c3f44',
//                             }}
//                           >
//                             Motivo: {reason}.
//                           </p>
//                         </ul>

//                         <hr
//                           style={{
//                             width: '100%',
//                             border: 'none',
//                             borderTop: '1px solid #eaeaea',
//                             margin: '30px 0',
//                           }}
//                         />

//                         <table
//                           align="center"
//                           width="100%"
//                           border={0}
//                           cellPadding="0"
//                           cellSpacing="0"
//                           style={{ marginTop: '24px', display: 'block' }}
//                         >
//                           <tbody>
//                             <tr>
//                               <td></td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </body>
//     </html>
//   </div>
// );
// emailTemplates/helpEmailTemplate.ts
export function renderHelpEmailTemplate(userEmail: string, reason: string = ''): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Solicitud de Ayuda</title>
      <style type="text/css">
        /* Estilos inline para mejor compatibilidad */
        body {
          margin: 0;
          padding: 0;
          background-color: #f3f3f5;
          font-family: 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 16px;
          line-height: 1.6;
          color: #333333;
        }
        .container {
          max-width: 680px;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #dddddd;
          border-top: none;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #777777;
          text-align: center;
          padding: 20px;
          border-top: 1px solid #eeeeee;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-weight: bold;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Encabezado -->
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Solicitud de Ayuda</h1>
        </div>
        
        <!-- Contenido principal -->
        <div class="content">
          <p>Hola,</p>
          
          <p>Has recibido una nueva solicitud de ayuda con la siguiente información:</p>
          
          <div class="info-item">
            <span class="info-label">Usuario:</span> ${escapeHtml(userEmail)}
          </div>
          
          ${reason ? `
            <div class="info-item">
              <div class="info-label">Motivo de la consulta:</div>
              <div>${escapeHtml(reason)}</div>
            </div>
          ` : ''}
          
          <p>Por favor, responde a esta solicitud lo antes posible.</p>
          
          <p>Gracias,<br>El equipo de CodeControl</p>
        </div>
        
        <!-- Pie de página -->
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} CodeControl. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función auxiliar para escapar HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}