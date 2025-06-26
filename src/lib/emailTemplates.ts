// // interface EmailInfo {
// //   recurso: string;
// //   document_name: string;
// //   company_name: string;
// //   resource_name: string;
// //   document_number: string;
// // }

// // export function renderHelpEmailTemplate(userEmail: string, reason?: string): string {
// //   return `
// //     <!DOCTYPE html>
// //     <html>
// //     <head>
// //       <style>
// //         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
// //         .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
// //         .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
// //         .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
// //       </style>
// //     </head>
// //     <body>
// //       <div class="header">
// //         <h2>Solicitud de Ayuda</h2>
// //       </div>
// //       <div class="content">
// //         <p>Has recibido una nueva solicitud de ayuda de: <strong>${userEmail}</strong></p>
// //         ${reason ? `<p><strong>Motivo:</strong><br>${reason}</p>` : ''}
// //         <p>Por favor, contacta al usuario lo antes posible.</p>
// //       </div>
// //       <div class="footer">
// //         <p>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
// //       </div>
// //     </body>
// //     </html>
// //   `;
// // }

// // export function renderDocumentEmailTemplate(userEmail: string, info: EmailInfo): string {
// //   return `
// //     <!DOCTYPE html>
// //     <html>
// //     <head>
// //       <style>
// //         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
// //         .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
// //         .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
// //         .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
// //         .info-item { margin-bottom: 10px; }
// //         .info-label { font-weight: bold; display: inline-block; width: 150px; }
// //       </style>
// //     </head>
// //     <body>
// //       <div class="header">
// //         <h2>Nuevo Documento</h2>
// //       </div>
// //       <div class="content">
// //         <p>Se ha recibido un nuevo documento con la siguiente información:</p>
        
// //         <div class="info-item">
// //           <span class="info-label">Recurso:</span>
// //           <span>${info.recurso}</span>
// //         </div>
// //         <div class="info-item">
// //           <span class="info-label">Nombre del Documento:</span>
// //           <span>${info.document_name}</span>
// //         </div>
// //         <div class="info-item">
// //           <span class="info-label">Empresa:</span>
// //           <span>${info.company_name}</span>
// //         </div>
// //         <div class="info-item">
// //           <span class="info-label">Recurso:</span>
// //           <span>${info.resource_name}</span>
// //         </div>
// //         <div class="info-item">
// //           <span class="info-label">Número de Documento:</span>
// //           <span>${info.document_number}</span>
// //         </div>
        
// //         <p style="margin-top: 20px;">Usuario: <strong>${userEmail}</strong></p>
// //       </div>
// //       <div class="footer">
// //         <p>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
// //       </div>
// //     </body>
// //     </html>
// //   `;
// // }
// interface CompanyConfig {
//   name: string;
//   logo: string;
//   website: string;
//   supportEmail: string;
//   primaryColor: string;
//   secondaryColor: string;
// }

// interface EmailInfo {
//   recurso: string
//   document_name: string
//   company_name: string
//   resource_name: string
//   document_number: string
//   companyConfig: CompanyConfig
// }

// // Configuración de la empresa - Solo cambiar aquí para personalizar
// // const COMPANY_CONFIG = {
// //   name: "Tu Empresa S.A.", // Cambiar por tu nombre de empresa
// //   logo: "https://via.placeholder.com/200x60/667eea/ffffff?text=TU+EMPRESA", // Cambiar por tu logo
// //   website: "https://tuempresa.com",
// //   supportEmail: "soporte@tuempresa.com",
// //   primaryColor: "#667eea",
// //   secondaryColor: "#764ba2",
// // }

// function getCorporateStyles(companyConfig: CompanyConfig): string {
//   return `
//     <style>
//       * {
//         margin: 0;
//         padding: 0;
//         box-sizing: border-box;
//       }
      
//       body {
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//         line-height: 1.6;
//         color: #374151;
//         background-color: #f8fafc;
//         margin: 0;
//         padding: 0;
//       }
      
//       .email-wrapper {
//         background-color: #f8fafc;
//         padding: 20px 0;
//         min-height: 100vh;
//       }
      
//       .email-container {
//         max-width: 600px;
//         margin: 0 auto;
//         background-color: #ffffff;
//         border-radius: 12px;
//         overflow: hidden;
//         box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
//       }
      
//       .header {
//         background: linear-gradient(135deg, ${companyConfig.primaryColor} 0%, ${companyConfig.secondaryColor} 100%);
//         padding: 40px 30px;
//         text-align: center;
//         position: relative;
//         overflow: hidden;
//       }
      
//       .header::before {
//         content: '';
//         position: absolute;
//         top: 0;
//         left: 0;
//         right: 0;
//         bottom: 0;
//         background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
//         pointer-events: none;
//       }
      
//       .logo-container {
//         background-color: rgba(255, 255, 255, 0.95);
//         border-radius: 12px;
//         padding: 20px;
//         margin-bottom: 20px;
//         display: inline-block;
//         box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
//         position: relative;
//         z-index: 1;
//         backdrop-filter: blur(10px);
//       }
      
//       .logo {
//         max-height: 60px;
//         max-width: 200px;
//         height: auto;
//         width: auto;
//         display: block;
//       }
      
//       .header-title {
//         color: white;
//         font-size: 28px;
//         font-weight: 700;
//         margin: 0;
//         text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
//         position: relative;
//         z-index: 1;
//       }
      
//       .header-subtitle {
//         color: rgba(255, 255, 255, 0.9);
//         font-size: 16px;
//         margin-top: 8px;
//         font-weight: 400;
//         position: relative;
//         z-index: 1;
//       }
      
//       .content {
//         padding: 40px 30px;
//         background-color: #ffffff;
//       }
      
//       .content-title {
//         color: #1f2937;
//         font-size: 24px;
//         margin-bottom: 24px;
//         font-weight: 600;
//         border-bottom: 3px solid #e5e7eb;
//         padding-bottom: 12px;
//         position: relative;
//       }
      
//       .content-title::after {
//         content: '';
//         position: absolute;
//         bottom: -3px;
//         left: 0;
//         width: 60px;
//         height: 3px;
//         background: linear-gradient(135deg, ${companyConfig.primaryColor} 0%, ${companyConfig.secondaryColor} 100%);
//         border-radius: 2px;
//       }
      
//       .content p {
//         margin-bottom: 18px;
//         color: #4b5563;
//         font-size: 16px;
//         line-height: 1.7;
//       }
      
//       .greeting {
//         font-size: 18px;
//         color: #374151;
//         margin-bottom: 20px;
//         font-weight: 500;
//       }
      
//       .info-section {
//         background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
//         border: 1px solid #e2e8f0;
//         border-radius: 16px;
//         padding: 32px;
//         margin: 32px 0;
//         position: relative;
//         box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
//       }
      
//       .info-section::before {
//         content: '';
//         position: absolute;
//         top: 0;
//         left: 0;
//         width: 5px;
//         height: 100%;
//         background: linear-gradient(135deg, ${companyConfig.primaryColor} 0%, ${companyConfig.secondaryColor} 100%);
//         border-radius: 3px;
//       }
      
//       .info-section-title {
//         color: ${companyConfig.primaryColor};
//         font-size: 18px;
//         font-weight: 600;
//         margin-bottom: 20px;
//         display: flex;
//         align-items: center;
//         gap: 8px;
//       }
      
//       .info-grid {
//         display: grid;
//         gap: 16px;
//       }
      
//       .info-item {
//         display: flex;
//         align-items: flex-start;
//         padding: 14px 0;
//         border-bottom: 1px solid #e5e7eb;
//         transition: background-color 0.2s ease;
//       }
      
//       .info-item:last-child {
//         border-bottom: none;
//       }
      
//       .info-item:hover {
//         background-color: rgba(255, 255, 255, 0.5);
//         margin: 0 -16px;
//         padding: 14px 16px;
//         border-radius: 8px;
//       }
      
//       .info-label {
//         font-weight: 600;
//         color: #374151;
//         min-width: 160px;
//         font-size: 14px;
//         text-transform: uppercase;
//         letter-spacing: 0.5px;
//         margin-right: 16px;
//         display: flex;
//         align-items: center;
//         gap: 6px;
//       }
      
//       .info-value {
//         color: #1f2937;
//         font-size: 16px;
//         flex: 1;
//         font-weight: 500;
//         word-break: break-word;
//       }
      
//       .highlight {
//         background: linear-gradient(135deg, ${companyConfig.primaryColor}20 0%, ${companyConfig.secondaryColor}20 100%);
//         color: ${companyConfig.primaryColor};
//         padding: 6px 14px;
//         border-radius: 8px;
//         font-weight: 600;
//         display: inline-block;
//         border: 1px solid ${companyConfig.primaryColor}30;
//       }
      
//       .alert-box {
//         background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
//         border: 1px solid #f59e0b;
//         border-radius: 12px;
//         padding: 20px;
//         margin: 24px 0;
//         border-left: 5px solid #f59e0b;
//         box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.1);
//       }
      
//       .alert-box p {
//         margin: 0;
//         color: #92400e;
//         font-weight: 600;
//         font-size: 15px;
//       }
      
//       .status-badge {
//         display: inline-flex;
//         align-items: center;
//         gap: 6px;
//         background: linear-gradient(135deg, #10b981 0%, #059669 100%);
//         color: white;
//         padding: 8px 16px;
//         border-radius: 20px;
//         font-weight: 600;
//         font-size: 14px;
//         margin: 16px 0;
//         box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
//       }
      
//       .cta-button {
//         display: inline-block;
//         background: linear-gradient(135deg, ${companyConfig.primaryColor} 0%, ${companyConfig.secondaryColor} 100%);
//         color: white;
//         padding: 16px 32px;
//         text-decoration: none;
//         border-radius: 10px;
//         font-weight: 600;
//         margin: 24px 0;
//         transition: all 0.3s ease;
//         box-shadow: 0 8px 16px -4px rgba(102, 126, 234, 0.4);
//         font-size: 16px;
//       }
      
//       .cta-button:hover {
//         transform: translateY(-2px);
//         box-shadow: 0 12px 20px -4px rgba(102, 126, 234, 0.5);
//       }
      
//       .footer {
//         background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
//         padding: 32px 30px;
//         text-align: center;
//         border-top: 1px solid #e2e8f0;
//       }
      
//       .company-info {
//         margin-bottom: 24px;
//         color: #6b7280;
//         font-size: 15px;
//         line-height: 1.6;
//       }
      
//       .company-info strong {
//         color: ${companyConfig.primaryColor};
//         display: block;
//         margin-bottom: 12px;
//         font-size: 18px;
//         font-weight: 600;
//       }
      
//       .footer-links {
//         margin: 20px 0;
//         display: flex;
//         justify-content: center;
//         gap: 24px;
//         flex-wrap: wrap;
//       }
      
//       .footer-links a {
//         color: ${companyConfig.primaryColor};
//         text-decoration: none;
//         font-weight: 500;
//         padding: 8px 16px;
//         border-radius: 6px;
//         background-color: ${companyConfig.primaryColor}10;
//         transition: all 0.2s ease;
//         font-size: 14px;
//       }
      
//       .footer-links a:hover {
//         background-color: ${companyConfig.primaryColor}20;
//         transform: translateY(-1px);
//       }
      
//       .disclaimer {
//         font-size: 13px;
//         color: #9ca3af;
//         margin-top: 24px;
//         padding-top: 24px;
//         border-top: 1px solid #e5e7eb;
//         font-style: italic;
//         line-height: 1.5;
//       }
      
//       .timestamp {
//         background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
//         color: #6b7280;
//         padding: 10px 16px;
//         border-radius: 8px;
//         font-size: 14px;
//         display: inline-flex;
//         align-items: center;
//         gap: 8px;
//         margin: 20px 0;
//         border: 1px solid #d1d5db;
//       }
      
//       .divider {
//         height: 2px;
//         background: linear-gradient(135deg, ${companyConfig.primaryColor} 0%, ${companyConfig.secondaryColor} 100%);
//         margin: 32px 0;
//         border-radius: 1px;
//         opacity: 0.3;
//       }
      
//       @media (max-width: 600px) {
//         .email-wrapper {
//           padding: 10px;
//         }
        
//         .email-container {
//           border-radius: 8px;
//           margin: 0 10px;
//         }
        
//         .header, .content, .footer {
//           padding: 24px 20px;
//         }
        
//         .header-title {
//           font-size: 24px;
//         }
        
//         .content-title {
//           font-size: 20px;
//         }
        
//         .info-item {
//           flex-direction: column;
//           gap: 6px;
//           padding: 12px 0;
//         }
        
//         .info-label {
//           min-width: auto;
//           margin-right: 0;
//           font-size: 13px;
//         }
        
//         .info-value {
//           font-size: 15px;
//         }
        
//         .logo-container {
//           padding: 16px;
//         }
        
//         .logo {
//           max-height: 50px;
//         }
        
//         .footer-links {
//           flex-direction: column;
//           gap: 12px;
//         }
        
//         .cta-button {
//           padding: 14px 24px;
//           font-size: 15px;
//         }
//       }
//     </style>
//   `
// }

// export function renderHelpEmailTemplate(userEmail: string, info: EmailInfo, reason?: string): string {
//   const companyConfig = info.companyConfig;
//   const timestamp = new Date().toLocaleString("es-ES", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     timeZone: "America/Mexico_City",
//   })

//   return `
//     <!DOCTYPE html>
//     <html lang="es">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Solicitud de Ayuda - ${companyConfig.name}</title>
//       ${getCorporateStyles(companyConfig)}
//     </head>
//     <body>
//       <div class="email-wrapper">
//         <div class="email-container">
//           <div class="header">
//             <div class="logo-container">
//               <img src="${companyConfig.logo}" alt="${companyConfig.name}" class="logo">
//             </div>
//             <h1 class="header-title">Solicitud de Ayuda</h1>
//             <div class="header-subtitle">${companyConfig.name}</div>
//           </div>
          
//           <div class="content">
//             <h2 class="content-title">Nueva Solicitud de Soporte</h2>
            
//             <p class="greeting">Estimado equipo de soporte,</p>
            
//             <p>Se ha recibido una nueva solicitud de ayuda que requiere <strong>atención inmediata</strong>. A continuación se detallan los datos de la solicitud:</p>
            
//             <div class="info-section">
//               <div class="info-section-title">
//                 📋 Detalles de la Solicitud
//               </div>
//               <div class="info-grid">
//                 <div class="info-item">
//                   <span class="info-label">👤 Usuario:</span>
//                   <span class="info-value highlight">${userEmail}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">📅 Fecha:</span>
//                   <span class="info-value">${timestamp}</span>
//                 </div>
                
//                 ${
//                   reason
//                     ? `
//                 <div class="info-item">
//                   <span class="info-label">📝 Motivo:</span>
//                   <span class="info-value">${reason}</span>
//                 </div>
//                 `
//                     : ""
//                 }
//               </div>
//             </div>
            
//             <div class="alert-box">
//               <p><strong>⚡ Acción Requerida:</strong> Por favor, contacte al usuario lo antes posible para brindar la asistencia necesaria.</p>
//             </div>
            
//             <div class="divider"></div>
            
//             <p>Para brindar un mejor servicio, asegúrese de responder dentro de las próximas <strong>2 horas hábiles</strong>.</p>
            
//             ${
//               companyConfig.supportEmail
//                 ? `
//             <p>Para más información o escalamiento, contacte a: <a href="mailto:${companyConfig.supportEmail}" style="color: ${companyConfig.primaryColor}; font-weight: 600; text-decoration: none;">${companyConfig.supportEmail}</a></p>
//             `
//                 : ""
//             }
            
//             <div class="timestamp">
//               🕐 Generado el ${timestamp}
//             </div>
//           </div>
          
//           <div class="footer">
//             <div class="company-info">
//               <strong>${companyConfig.name}</strong>
//               <div>Comprometidos con la excelencia en el servicio</div>
//             </div>
            
//             <div class="footer-links">
//               ${companyConfig.website ? `<a href="${companyConfig.website}">🌐 Sitio Web</a>` : ""}
//               ${companyConfig.supportEmail ? `<a href="mailto:${companyConfig.supportEmail}">📧 Contactar Soporte</a>` : ""}
//             </div>
            
//             <div class="disclaimer">
//               Este es un correo electrónico automático generado por el sistema de ${companyConfig.name}. 
//               Por favor, no responda directamente a este mensaje. Para asistencia, utilice los canales oficiales de soporte.
//             </div>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `
// }

// export function renderDocumentEmailTemplate(userEmail: string, info: EmailInfo): string {
//   const companyConfig = info.companyConfig;
//   const timestamp = new Date().toLocaleString("es-ES", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     timeZone: "America/Mexico_City",
//   })

//   return `
//     <!DOCTYPE html>
//     <html lang="es">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Nuevo Documento - ${companyConfig.name}</title>
//       ${getCorporateStyles(companyConfig)}
//     </head>
//     <body>
//       <div class="email-wrapper">
//         <div class="email-container">
//           <div class="header">
//             <div class="logo-container">
//               <img src="${companyConfig.logo}" alt="${companyConfig.name}" class="logo">
//             </div>
//             <h1 class="header-title">Nuevo Documento</h1>
//             <div class="header-subtitle">${companyConfig.name}</div>
//           </div>
          
//           <div class="content">
//             <h2 class="content-title">Documento Procesado Exitosamente</h2>
            
//             <p class="greeting">Estimado equipo,</p>
            
//             <p>Se ha recibido y procesado un nuevo documento en el sistema. El documento ha sido <strong>validado correctamente</strong> y está disponible para su revisión.</p>
            
//             <div class="info-section">
//               <div class="info-section-title">
//                 📄 Información del Documento
//               </div>
//               <div class="info-grid">
//                 <div class="info-item">
//                   <span class="info-label">📋 Recurso:</span>
//                   <span class="info-value">${info.recurso}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">📄 Documento:</span>
//                   <span class="info-value highlight">${info.document_name}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">🏢 Empresa:</span>
//                   <span class="info-value">${info.company_name}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">🔖 Recurso:</span>
//                   <span class="info-value">${info.resource_name}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">🔢 Número:</span>
//                   <span class="info-value highlight">${info.document_number}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">👤 Usuario:</span>
//                   <span class="info-value">${userEmail}</span>
//                 </div>
                
//                 <div class="info-item">
//                   <span class="info-label">📅 Procesado:</span>
//                   <span class="info-value">${timestamp}</span>
//                 </div>
//               </div>
//             </div>
            
//             <div class="status-badge">
//               ✅ Estado: Procesado Correctamente
//             </div>
            
//             <div class="divider"></div>
            
//             <p>El documento está ahora disponible en el sistema y puede ser consultado por los usuarios autorizados.</p>
            
//             ${
//               companyConfig.website
//                 ? `
//             <a href="${companyConfig.website}/documents" class="cta-button">
//               📄 Ver Documento en el Sistema
//             </a>
//             `
//                 : ""
//             }
            
//             <div class="timestamp">
//               🕐 Procesado el ${timestamp}
//             </div>
//           </div>
          
//           <div class="footer">
//             <div class="company-info">
//               <strong>${companyConfig.name}</strong>
//               <div>Sistema de gestión documental corporativo</div>
//             </div>
            
//             <div class="footer-links">
//               ${companyConfig.website ? `<a href="${companyConfig.website}">🌐 Sitio Web</a>` : ""}
//               ${companyConfig.supportEmail ? `<a href="mailto:${companyConfig.supportEmail}">📧 Contactar Soporte</a>` : ""}
//             </div>
            
//             <div class="disclaimer">
//               Este es un correo electrónico automático generado por el sistema de ${companyConfig.name}. 
//               Por favor, no responda directamente a este mensaje. Para consultas sobre documentos, utilice el portal web.
//             </div>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `
// }


interface CompanyConfig {
  name: string
  logo: string
  website: string
  supportEmail: string
  primaryColor: string
  secondaryColor: string
}

interface EmailInfo {
  recurso: string
  document_name: string
  company_name: string
  resource_name: string
  document_number: string
  companyConfig?: CompanyConfig // Opcional para mantener compatibilidad
}

// Configuración por defecto
const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  name: "Tu Empresa S.A.",
  logo: "https://via.placeholder.com/200x60/4CAF50/FFFFFF?text=TU+EMPRESA",
  website: "https://tuempresa.com",
  supportEmail: "soporte@tuempresa.com",
  primaryColor: "#4CAF50",
  secondaryColor: "#388E3C",
}

// Estilos básicos compatibles con todos los clientes de email
function getBasicStyles(primaryColor: string): string {
  return `
    <style>
      /* Reset básico */
      body, table, td, p, a, li, blockquote {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      
      /* Estilos básicos */
      .email-body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      .header-cell {
        background-color: ${primaryColor};
        padding: 20px;
        text-align: center;
      }
      .content-cell {
        padding: 30px 20px;
        background-color: #ffffff;
      }
      .footer-cell {
        padding: 20px;
        background-color: #f8f8f8;
        text-align: center;
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .info-row {
        border-bottom: 1px solid #e0e0e0;
      }
      .info-label {
        padding: 12px 8px;
        background-color: #f8f8f8;
        font-weight: bold;
        width: 30%;
        vertical-align: top;
      }
      .info-value {
        padding: 12px 8px;
        vertical-align: top;
      }
      .highlight {
        background-color: #fff3cd;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      }
      .alert-box {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: ${primaryColor};
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        margin: 10px 0;
      }
      
      /* Responsive */
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
        }
        .content-cell {
          padding: 20px 15px !important;
        }
        .info-label, .info-value {
          display: block !important;
          width: 100% !important;
          padding: 8px !important;
        }
        .info-label {
          background-color: #f0f0f0 !important;
          font-size: 12px !important;
        }
      }
    </style>
  `
}

// ✅ FUNCIÓN 1: renderHelpEmailTemplate - NOMBRE EXACTO
export function renderHelpEmailTemplate(userEmail: string, reason?: string): string {
  const companyConfig = DEFAULT_COMPANY_CONFIG
  const timestamp = new Date().toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Solicitud de Ayuda - ${companyConfig.name}</title>
  ${getBasicStyles(companyConfig.primaryColor)}
</head>
<body class="email-body">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <!-- Contenedor principal -->
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header -->
          <tr>
            <td class="header-cell">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <img src="${companyConfig.logo}" alt="${companyConfig.name}" style="max-width: 200px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      Solicitud de Ayuda
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td class="content-cell">
              <h2 style="color: #333333; font-size: 20px; margin: 0 0 20px 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                Nueva Solicitud de Soporte
              </h2>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                Has recibido una nueva solicitud de ayuda de: <strong>${userEmail}</strong>
              </p>
              
              ${
                reason
                  ? `
              <table class="info-table" role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr class="info-row">
                  <td class="info-label">Motivo:</td>
                  <td class="info-value">${reason}</td>
                </tr>
              </table>
              `
                  : ""
              }
              
              <div class="alert-box">
                <p style="margin: 0; color: #856404; font-weight: bold;">
                  Por favor, contacta al usuario lo antes posible.
                </p>
              </div>
              
              <p style="color: #888888; font-size: 14px; margin: 20px 0 0 0; padding: 15px; background-color: #f8f8f8; border-radius: 4px;">
                Generado el ${timestamp}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer-cell">
              <p style="margin: 20px 0 0 0; color: #888888; font-size: 12px; line-height: 1.4;">
                Este es un correo automático, por favor no respondas directamente a este mensaje.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// ✅ FUNCIÓN 2: renderDocumentEmailTemplate - NOMBRE EXACTO
export function renderDocumentEmailTemplate(userEmail: string, info: EmailInfo): string {
  const companyConfig = info.companyConfig || DEFAULT_COMPANY_CONFIG
  const timestamp = new Date().toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nuevo Documento - ${companyConfig.name}</title>
  ${getBasicStyles(companyConfig.primaryColor)}
</head>
<body class="email-body">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <!-- Contenedor principal -->
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header -->
          <tr>
            <td class="header-cell">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <img src="${companyConfig.logo}" alt="${companyConfig.name}" style="max-width: 200px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      ${companyConfig.name}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      Nuevo Documento
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td class="content-cell">
              <h2 style="color: #333333; font-size: 20px; margin: 0 0 20px 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                Nuevo Documento
              </h2>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                ${info.resource_name} Se ha recibido un nuevo documento con la siguiente información:
              </p>
              
              <!-- Tabla de información del documento -->
              <table class="info-table" role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr class="info-row">
                  <td class="info-label">Recurso:</td>
                  <td class="info-value">${info.recurso}</td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Nombre del Documento:</td>
                  <td class="info-value">
                    <span class="highlight">${info.document_name}</span>
                  </td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Empresa:</td>
                  <td class="info-value">${info.company_name}</td>
                </tr>
              </table>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 20px 0;">
                Usuario: <strong>${userEmail}</strong>
              </p>
              
              <p style="color: #888888; font-size: 14px; margin: 20px 0 0 0; padding: 15px; background-color: #f8f8f8; border-radius: 4px;">
                Procesado el ${timestamp}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer-cell">
              <p style="margin: 20px 0 0 0; color: #888888; font-size: 12px; line-height: 1.4;">
                Este es un correo automático, por favor no respondas directamente a este mensaje.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `
}


