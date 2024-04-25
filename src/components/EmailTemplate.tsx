import * as React from 'react';
//import Logo1 from '../../public/logo-azul.png'
interface EmailTemplateProps {
  userEmail: string;
  reason: string;

}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  userEmail,
  reason,
}) => (
  <div>
    <img src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/logo_fondo_negro.png" style={{ width: '80%', height: '5cm' }} alt="Logo code control" />
    <h1>Hola, {userEmail}!, nos comunicamos de Codecontrol para avisarte que tienes un documento rechazado, en la bandeja de notificaciones podras verlo y hacer una actualización del mismo</h1>
    <h2>Motivo: {reason}</h2>
  </div>
);
