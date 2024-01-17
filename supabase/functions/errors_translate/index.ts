// Importa las dependencias necesarias
import { serve } from "https://deno.land/std/http/server.ts";

// Define la clave de la API de DeepL
const deepKey = Deno.env.get("DEEPL_KEY") as string;

// Define tus encabezados de CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Ajusta esto según tus necesidades de seguridad
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true"
};

// Crea el servidor HTTP
serve(async (req) => {
  // Verifica si es una solicitud de pre-vuelo
  if (req.method === "OPTIONS") {
    // Responde a la solicitud de pre-vuelo con los encabezados de CORS
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Intenta procesar la solicitud
  try {
    // Extrae el mensaje de error del cuerpo de la solicitud
    const { errorMessage } = await req.json();

    // Realiza la petición a la API de DeepL
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: errorMessage,
        target_lang: 'ES',
        auth_key: deepKey
      })
    });

    // Procesa la respuesta de DeepL
    const data = await response.json();
    const translatedError = data.translations[0].text;

    // Envía la respuesta traducida con los encabezados de CORS
    return new Response(JSON.stringify(translatedError), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    // Registra el error y envía una respuesta de error con los encabezados de CORS
    console.error('Error al traducir:', error);
    return new Response(JSON.stringify({ error: 'Error al traducir el mensaje.', errorMessage }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
