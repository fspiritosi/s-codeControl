import * as React from 'react';
//import Logo1 from '../../public/logo-azul.png'
interface EmailTemplateProps {
  userEmail: string;
  reason: string;

}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  userEmail,
  reason,
}) => (
   //<div>
  //   <img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/logo_fondo_negro.png" style={{ width: '80%', height: '5cm' }} alt="Logo code control" />
  //   <h1>Hola, {userEmail}!, nos comunicamos de Codecontrol para avisarte que tienes un documento rechazado, en la bandeja de notificaciones podras verlo y hacer una actualización del mismo</h1>
  //   <h2>Motivo: {reason}</h2>
  // </div>
  <div>{
// ¨<!DOCTYPE html PUBLIC >
// <html lang="es">

// <head>
//   <meta content="text/html; charset=UTF-8"/>
// </head>


// <body style="background-color:#f3f3f5;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
//   <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;width:680px;margin:0 auto;background-color:#ffffff">
//     <tbody>
//       <tr style="width:100%">
//         <td>
          
//           <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="border-radius:0px 0px 0 0;display:flex;flex-direciont:column;background-color:#2b2d6e">
//             <tbody>
//               <tr>
//                 <td>
//                   <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
//                     <tbody style="width:100%">
//                       <tr style="width:100%">
//                         <td style="padding:20px 30px 15px">
//                           <h1 style="color:#fff;font-size:27px;font-weight:bold;line-height:27px">Codecontrol.com.ar</h1>
//                           <p style="font-size:17px;line-height:24px;margin:16px 0;color:#fff">Documentos a Vencer en los proximos 45 días</p>
//                         </td>
//                         <td  style="padding:30px 10px"><img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/Logo%20Juegos%20gaming%20moderno%20azul%20y%20violeta%20(4).png" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%" width="140" /></td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//           <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:30px 30px 40px 30px">
//             <tbody>
//               <tr>
//                 <td>
//                   <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Hola, {userEmail}!, nos comunicamos de Codecontrol para avisarte que tienes un documento rechazado, en la bandeja de notificaciones podras verlo y hacer una actualización del mismo</h2>
                  
//                   <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
                  
//                   <ul>
                    
                    
//                     <p style="font-size:15px;line-height:21px;margin:16px 0;color:#3c3f44">Motivo: {reason}.</p>
                    
//                   </ul>
                  
//                   <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:30px 0" />
//                   <h2 style="margin:0 0 15px;font-weight:bold;font-size:21px;line-height:21px;color:#0c0d0e">Para ver los documentos diríjase a la app</h2>
//                   <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:24px;display:block">
//                     <tbody>
//                       <tr>
//                         <td><a href="https://codecontrol.com.ar" style="color:#fff;text-decoration:none;background-color:#0095ff;border:1px solid #0077cc;font-size:17px;line-height:17px;padding:13px 17px;border-radius:4px;max-width:120px" target="_blank">ir a codecontrol.com.ar</a></td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </td>
//       </tr>
//     </tbody>
//   </table>
//   <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="width:680px;max-width:100%;margin:32px auto 0 auto;padding:0 30px">
    
//   </table>
// </body>

// </html>
<div>
    {/* Tu código HTML aquí */}
    <div>
      <img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/logo_fondo_negro.png" className="w-80 h-20" alt="Logo code control" />
      <h1>Hola, {userEmail}!, nos comunicamos de Codecontrol para avisarte que tienes un documento rechazado, en la bandeja de notificaciones podrás verlo y hacer una actualización del mismo</h1>
      <h2>Motivo: {reason}</h2>
    </div>
    <html lang="es">
      <head>
        <meta content="text/html; charset=UTF-8"/>
      </head>
      <body className="bg-gray-100 font-sans">
        {/* Resto de tu código HTML aquí */}
      </body>
    </html>
  </div>
}</div>
);
