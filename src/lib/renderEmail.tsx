// 'use client';

// import { sendEmail as sendEmailApi } from '@/app/actions/sendEmail';

// type EmailInfo = {
//   recurso: string;
//   document_name: string;
//   company_name: string;
//   resource_name: string;
//   document_number: string;
// };

// function isEmailInfo(body: unknown): body is EmailInfo {
//   return (
//     body !== null &&
//     typeof body === 'object' &&
//     'recurso' in body &&
//     'document_name' in body &&
//     'company_name' in body &&
//     'resource_name' in body &&
//     'document_number' in body
//   );
// }

// export async function renderEmailTemplate(options: {
//   to: string;
//   userEmail: string;
//   react?: string;
//   body?: unknown;
// }): Promise<string> {
//   if (options.to !== 'diegodac77@gmail.com' && (!options.body || !isEmailInfo(options.body))) {
//     throw new Error('Invalid email info provided. Required fields: recurso, document_name, company_name, resource_name, document_number');
//   }

//   // Esta función ahora solo es un wrapper para mantener la compatibilidad
//   // con el código existente, pero realmente hace una petición a la API
//   const response = await sendEmailApi({
//     to: options.to,
//     subject: 'Mensaje de CodeControl',
//     userEmail: options.userEmail,
//     react: options.react,
//     body: options.body,
//   });

//   if (!response.success) {
//     throw new Error('Error al renderizar el correo');
//   }

//   // Devolvemos un string vacío ya que el contenido real se maneja en el servidor
//   return '';
// }

// export async function sendEmail(options: {
//   to: string;
//   subject: string;
//   userEmail: string;
//   react?: string;
//   body?: unknown;
//   html?: string;
//   text?: string;
// }) {
//   try {
//     const response = await fetch('/api/send', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         to: options.to,
//         subject: options.subject,
//         userEmail: options.userEmail,
//         react: options.react,
//         body: options.body,
//         html: options.html,
//         text: options.text,
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || 'Error al enviar el correo');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error en sendEmail:', error);
//     throw error;
//   }
// }
