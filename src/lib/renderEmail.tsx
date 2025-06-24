'use client';

import { EmailTemplate } from '@/components/EmailTemplate';
import { EmailTemplateHelp } from '@/components/EmailTemplateHelp';
import { renderToStaticMarkup } from 'react-dom/server';

type EmailInfo = {
  recurso: string;
  document_name: string;
  company_name: string;
  resource_name: string;
  document_number: string;
};

function isEmailInfo(body: unknown): body is EmailInfo {
  return (
    body !== null &&
    typeof body === 'object' &&
    'recurso' in body &&
    'document_name' in body &&
    'company_name' in body &&
    'resource_name' in body &&
    'document_number' in body
  );
}

export async function renderEmailTemplate(options: {
  to: string;
  userEmail: string;
  react?: string;
  body?: unknown;
}): Promise<string> {
  if (options.to !== 'info@codecontrol.com.ar' && (!options.body || !isEmailInfo(options.body))) {
    throw new Error('Invalid email info provided. Required fields: recurso, document_name, company_name, resource_name, document_number');
  }

  const template = options.to === 'info@codecontrol.com.ar'
    ? EmailTemplateHelp({ 
        userEmail: options.userEmail, 
        reason: options.react 
      })
    : EmailTemplate({ 
        userEmail: options.userEmail, 
        reason: options.react, 
        emailInfo: options.body as EmailInfo
      });

  // In a client component, we can safely use renderToStaticMarkup
  return renderToStaticMarkup(template);
}

// Función auxiliar para enviar correos usando Nodemailer a través de la API
export async function sendEmail(options: {
  to: string;
  subject: string;
  userEmail: string;
  react?: string;
  body?: unknown;
  html?: string;
  text?: string;
}) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        userEmail: options.userEmail,
        react: options.react,
        body: options.body,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al enviar el correo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en sendEmail:', error);
    throw error;
  }
}
