'use server';

import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '@/lib/renderEmail';
import { NextResponse } from 'next/server';

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
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar configuración de conexión
transporter.verify(function(error) {
  if (error) {
    console.error('Error de conexión SMTP:', error);
  } else {
    
  }
});

type EmailRequest = {
  to: string;
  subject: string;
  userEmail: string;
  react?: string;
  body?: unknown;
  html?: string;
  text?: string;
};

export async function POST(request: Request) {
  try {
    const requestData: EmailRequest = await request.json();
    const { to, subject, userEmail, react, body, html, text } = requestData;
    const toEmail = to || 'diegodac77@gmail.com';
    const from = `"${process.env.EMAIL_FROM_NAME || 'CodeControl'}" <${process.env.SMTP_USER}>`;

    // Si se usa el sistema de templates
    if (react !== undefined || body !== undefined) {
      const emailHtml = await renderEmailTemplate({
        to: toEmail,
        userEmail,
        react,
        body,
      });

      const mailOptions = {
        from,
        to: toEmail,
        subject: subject || 'Mensaje de CodeControl',
        html: emailHtml,
        text: 'Por favor, activa el soporte HTML en tu cliente de correo para ver este mensaje correctamente.',
      };

      const info = await transporter.sendMail(mailOptions);
      
      return NextResponse.json({ 
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
    }

    // Si se proporciona HTML directamente
    if (html || text) {
      const mailOptions = {
        from,
        to: toEmail,
        subject: subject || 'Mensaje de CodeControl',
        html,
        text: text || 'Por favor, activa el soporte HTML en tu cliente de correo para ver este mensaje correctamente.',
      };

      const info = await transporter.sendMail(mailOptions);
      
      return NextResponse.json({ 
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
    }

    return NextResponse.json(
      { error: 'Faltan campos requeridos: react/body o html/text son obligatorios' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error al enviar el correo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        error: 'Error al enviar el correo',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
