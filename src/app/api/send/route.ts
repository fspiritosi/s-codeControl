
import { EmailTemplate } from '../../../components/EmailTemplate';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const userEmail = requestData.userEmail;
    console.log(requestData, "data")

    const data = await resend.emails.send({
      from: 'Codecontrol <onboarding@resend.dev>',
      //from: 'Codecontrol <onboarding@codecontrol.com.ar>',
      to: [userEmail],
      subject: requestData.subject,
      react: EmailTemplate({ userEmail: userEmail, reason: requestData.react}), 
      text:'Aqui va el texto'
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
