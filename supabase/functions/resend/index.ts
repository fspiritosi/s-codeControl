// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// console.log("Hello from Functions!")

// Deno.serve(async (req) => {
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/resend' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// const RESEND_API_KEY = 're_G6LvgJrg_5KDtFsxpM1EiQVzFKj1KwNUT';

// const handler = async (_request: Request): Promise<Response> => {
//     const res = await fetch('https://api.resend.com/emails', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${RESEND_API_KEY}`
//         },
//         body: JSON.stringify({
//             from: 'Codecontrol <team@codecontrol.com.ar>',
//             to: ['delivered@resend.dev'],
//             subject: 'hello world',
//             html: '<strong>it works!</strong>',
//         })
//     });

//     const data = await res.json();

//     return new Response(JSON.stringify(data), {
//         status: 200,
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     });
// };

// serve(handler);


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const RESEND_API_KEY = Deno.env.get('RESEND_SUPABASE_API_KEY');

interface EmailData {
    to: string[]; // Array de destinatarios
    subject: string; // Asunto del correo
    html: string; // Cuerpo del correo en formato HTML
}

const handler = async (request: Request): Promise<Response> => {
    try {
        // Parsea el cuerpo de la solicitud como JSON
        const body = await request.json();

        // Verifica si los datos necesarios están presentes en el cuerpo de la solicitud
        if (!body.to || !body.subject || !body.html) {
            throw new Error('Faltan parámetros requeridos en el cuerpo de la solicitud');
        }

        // Realiza la solicitud a la API de Resend para enviar el correo electrónico
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Codecontrol <team@codecontrol.com.ar>',
                to: body.to,
                subject: body.subject,
                html: body.html,
            })
        });

        // Obtiene la respuesta de la API de Resend
        const data = await res.json();

        // Retorna la respuesta de la API de Resend
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        // Si ocurre un error, retorna una respuesta de error
        return new Response(JSON.stringify({ error: error }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
};


serve(handler);


