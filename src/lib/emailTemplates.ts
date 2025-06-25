interface EmailInfo {
  recurso: string;
  document_name: string;
  company_name: string;
  resource_name: string;
  document_number: string;
}

export function renderHelpEmailTemplate(userEmail: string, reason?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Solicitud de Ayuda</h2>
      </div>
      <div class="content">
        <p>Has recibido una nueva solicitud de ayuda de: <strong>${userEmail}</strong></p>
        ${reason ? `<p><strong>Motivo:</strong><br>${reason}</p>` : ''}
        <p>Por favor, contacta al usuario lo antes posible.</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
      </div>
    </body>
    </html>
  `;
}

export function renderDocumentEmailTemplate(userEmail: string, info: EmailInfo): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; display: inline-block; width: 150px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Nuevo Documento</h2>
      </div>
      <div class="content">
        <p>Se ha recibido un nuevo documento con la siguiente información:</p>
        
        <div class="info-item">
          <span class="info-label">Recurso:</span>
          <span>${info.recurso}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Nombre del Documento:</span>
          <span>${info.document_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Empresa:</span>
          <span>${info.company_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Recurso:</span>
          <span>${info.resource_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Número de Documento:</span>
          <span>${info.document_number}</span>
        </div>
        
        <p style="margin-top: 20px;">Usuario: <strong>${userEmail}</strong></p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
      </div>
    </body>
    </html>
  `;
}
