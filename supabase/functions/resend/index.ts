


// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


// const RESEND_API_KEY = Deno.env.get('RESEND_SUPABASE_API_KEY');

// interface EmailData {
//     to: string[]; // Array de destinatarios
//     subject: string; // Asunto del correo
//     html: string; // Cuerpo del correo en formato HTML
// }

// const handler = async (request: Request): Promise<Response> => {
//     try {
//         // Parsea el cuerpo de la solicitud como JSON
//         const body = await request.json();

//         // Verifica si los datos necesarios están presentes en el cuerpo de la solicitud
//         if (!body.to || !body.subject || !body.html) {
//             throw new Error('Faltan parámetros requeridos en el cuerpo de la solicitud');
//         }

//         // Realiza la solicitud a la API de Resend para enviar el correo electrónico
//         const res = await fetch('https://api.resend.com/emails', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${RESEND_API_KEY}`
//             },
//             body: JSON.stringify({
//                 from: 'Codecontrol <team@codecontrol.com.ar>',
//                 to: body.to,
//                 subject: body.subject,
//                 html: body.html,
//             })
//         });

//         // Obtiene la respuesta de la API de Resend
//         const data = await res.json();

//         // Retorna la respuesta de la API de Resend
//         return new Response(JSON.stringify(data), {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//     } catch (error) {
//         // Si ocurre un error, retorna una respuesta de error
//         return new Response(JSON.stringify({ error: error }), {
//             status: 500,
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//     }
// };


// serve(handler);


