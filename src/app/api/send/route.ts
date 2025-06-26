'use server';

import nodemailer from 'nodemailer';
import { renderDocumentEmailTemplate, renderHelpEmailTemplate } from '@/lib/emailTemplates';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Validar variables de entorno requeridas
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'development') {
  console.warn(`Advertencia: Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
}

// Crear transporter reutilizable
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 300,
  tls: {
    rejectUnauthorized: false
  }
});

type EmailRequest = {
  to: string;
  subject: string;
  userEmail: string;
  react?: string;
  reason?: string;
  body?: unknown;
  html?: string;
  text?: string;
};

export async function POST(request: Request) {
  const supabase = supabaseServer();
  
  // Declarar variables que necesitamos en todo el ámbito
  let toEmail = 'diegodac77@gmail.com';
  let emailSubject = 'Mensaje de CodeControl';
  
  try {
    const requestData: EmailRequest = await request.json();
    const { to, subject, userEmail, react, reason, body, html, text } = requestData;
    // Actualizar valores con los datos de la solicitud si están presentes
    if (to) toEmail = to;
    if (subject) emailSubject = subject;
    const from = `"${process.env.EMAIL_FROM_NAME || 'CodeControl'}" <${process.env.SMTP_USER}>`;

    // Si se usa el sistema de templates
    if (react && body) {
      let emailHtml: string;
      
      if (react === 'help') {
        // Plantilla de ayuda - usamos 'reason' si está disponible, si no, usamos un string vacío
        emailHtml = renderHelpEmailTemplate(userEmail, body as any, requestData.reason || '');
      } else {
        // Plantilla de documento - pasamos el body completo
        
        emailHtml = renderDocumentEmailTemplate(userEmail, body as any);
      }

      if (!emailHtml) {
        throw new Error('No se pudo renderizar la plantilla de correo');
      }

      const mailOptions = {
        from,
        to: toEmail,
        subject: emailSubject,
        html: emailHtml,
        text: 'Por favor, activa el soporte HTML en tu cliente de correo para ver este mensaje correctamente.',
      };

      const info = await transporter.sendMail(mailOptions);
      
      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from('sent_emails'as any)
        .insert({
          subject: subject || 'Mensaje de CodeControl',
          recipient: toEmail,
          status: info.accepted?.length ? 'sent' : 'failed',
          template_name: react || null,
          content: emailHtml,
          error_message: info.rejected?.length ? 'Algunos destinatarios fueron rechazados' : null,
          metadata: {
            message_id: info.messageId || '',
            accepted: info.accepted || [],
            rejected: info.rejected || []
          }
        });

      if (dbError) {
        console.error('Error al guardar el registro de envío:', dbError);
      }

      return NextResponse.json({ 
        success: true,
        messageId: info.messageId || '',
        accepted: info.accepted || [],
        rejected: info.rejected || []
      });
    }

    // Si se proporciona HTML directamente
    if (html || text) {
      const mailOptions = {
        from,
        to: toEmail,
        subject: emailSubject,
        html,
        text: text || 'Por favor, activa el soporte HTML en tu cliente de correo para ver este mensaje correctamente.',
      };

      const info = await transporter.sendMail(mailOptions);
      
      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from('sent_emails'as any)
        .insert({
          subject: subject || 'Mensaje de CodeControl',
          recipient: toEmail,
          status: info.accepted?.length ? 'sent' : 'failed',
          template_name: null,
          content: html || text || null,
          error_message: info.rejected?.length ? 'Algunos destinatarios fueron rechazados' : null,
          metadata: {
            message_id: info.messageId || '',
            accepted: info.accepted || [],
            rejected: info.rejected || []
          }
        });

      if (dbError) {
        console.error('Error al guardar el registro de envío:', dbError);
      }

      return NextResponse.json({ 
        success: true,
        messageId: info.messageId || '',
        accepted: info.accepted || [],
        rejected: info.rejected || []
      });
    }

    return NextResponse.json(
      { error: 'Se requiere un template o contenido HTML/Texto' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error al enviar el correo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    // Registrar el error en la base de datos
    if (toEmail) {
      await supabase
        .from('sent_emails'as any)
        .insert({
          subject: emailSubject,
          recipient: toEmail,
          status: 'failed',
          template_name: null,
          content: null,
          error_message: errorMessage,
          metadata: {
            error: error instanceof Error ? error.stack : null
          }
        });
    }

    return NextResponse.json(
      { 
        error: 'Error al enviar el correo',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}