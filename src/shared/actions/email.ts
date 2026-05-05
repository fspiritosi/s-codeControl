'use server';

import nodemailer from 'nodemailer';
import { renderDocumentEmailTemplate, renderHelpEmailTemplate } from '@/shared/lib/emailTemplates';

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

// Tipos necesarios
type EmailInfo = {
  recurso: string;
  document_name: string;
  company_name: string;
  resource_name: string;
  document_number: string;
};

type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

type EmailOptions = {
  to: string;
  subject: string;
  userEmail?: string;
  template?: 'document' | 'help';
  body?: EmailInfo;
  html?: string;
  text?: string;
  reason?: string;
  attachments?: EmailAttachment[];
  /**
   * Display name visible en el header `From:`. El email técnico siempre es
   * SMTP_USER (no se cambia para preservar SPF/DKIM). Default: "CodeControl".
   */
  fromName?: string;
  /**
   * Header `Reply-To:` — al responder, el mail del destinatario va a esta
   * dirección en lugar de al SMTP_USER.
   */
  replyTo?: string;
};

export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, userEmail, template, body, html, text, reason, attachments, fromName, replyTo } = options;

    let emailHtml = html;

    // Si se especifica un template, usarlo
    if (template && !html) {
      if (template === 'document' && body) {
        emailHtml = renderDocumentEmailTemplate(userEmail ?? '', body as any);
      } else if (template === 'help') {
        emailHtml = renderHelpEmailTemplate({ userEmail: userEmail ?? '', reason, body: body as any });
      }
    }

    // Si no hay HTML ni texto, no podemos enviar el correo
    if (!emailHtml && !text) {
      throw new Error('Se requiere contenido HTML o texto para enviar el correo');
    }

    // Configuracion basica del correo
    const fromDisplay = fromName?.trim() || 'CodeControl';
    const mailOptions: Parameters<typeof transporter.sendMail>[0] = {
      from: `"${fromDisplay}" <${process.env.SMTP_USER}>`,
      to: to || 'diegodac77@gmail.com',
      subject: subject || 'Mensaje de CodeControl',
      html: emailHtml,
      text: text || (emailHtml ? undefined : ''),
      ...(replyTo ? { replyTo } : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
