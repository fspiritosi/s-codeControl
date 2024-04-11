import { EmailTemplate } from '../../../components/email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_SUPABASE_API_KEY);

export async function POST(emailInfo:any) {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: emailInfo.to,
      subject: emailInfo.subject,
      text: 'Hello, this is the text content of the email',
      react: EmailTemplate(emailInfo.templateData),
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
