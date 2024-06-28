import { Resend } from 'resend';
import { EmailTemplate } from '../../../components/EmailTemplate';
import { EmailTemplateHelp } from '../../../components/EmailTemplateHelp';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const userEmail = requestData.userEmail;

    const template =
      requestData.to === 'info@codecontrol.com.ar'
        ? EmailTemplateHelp({ userEmail: userEmail, reason: requestData.react })
        : EmailTemplate({
            userEmail: userEmail,
            reason: requestData.react,
            emailInfo: requestData.body,
          });
    const data = await resend.emails.send({
      //from: 'Codecontrol <onboarding@resend.dev>',
      from: 'Codecontrol <team@codecontrol.com.ar>',
      to: requestData.to,
      subject: requestData.subject,
      react: template,
      text: '',
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
