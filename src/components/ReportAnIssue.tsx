'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLoggedUserStore } from '@/store/loggedUser';
import { useState } from 'react';

export function ReportAnIssue() {
  const [area, setArea] = useState('billing'); // Valor por defecto para el área
  const [nivelSeguridad, setNivelSeguridad] = useState('2'); // Valor por defecto para el nivel de seguridad
  const [asunto, setAsunto] = useState(''); // Valor inicial para el asunto
  const [descripcion, setDescripcion] = useState(''); // Valor inicial para la descripción
  const emailUser = useLoggedUserStore((state) => state.credentialUser?.email);
  async function submit() {
    try {
      //EmailTemplateHelp({ userEmail: emailUser as string, reason: descripcion });
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'info@codecontrol.com.ar',
          subject: asunto,
          react: descripcion,
          userEmail: emailUser,
        }),
      });

      if (response.ok) {
      } else {
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  }
  return (
    // <section className="md:mx-7 w-1/2">
    //   <Card>
    //     <CardHeader>
    //       <CardTitle>
    //         Reportar un problema (Todavia no tiene funcionalidad)
    //       </CardTitle>
    //       <CardDescription>¿En qué área tienes problemas?</CardDescription>
    //     </CardHeader>
    //     <CardContent className="grid gap-6">
    //       <div className="flex gap-2 flex-wrap">
    //         <div className=" gap-2">
    //           <Label htmlFor="area">Área</Label>
    //           <Select defaultValue="billing" >
    //             <SelectTrigger id="area">
    //               <SelectValue placeholder="Seleccionar" />
    //             </SelectTrigger>
    //             <SelectContent>
    //               <SelectItem value="team">Equipo</SelectItem>
    //               <SelectItem value="billing">Facturación</SelectItem>
    //               <SelectItem value="account">Cuenta</SelectItem>
    //               <SelectItem value="deployments">Implementaciones</SelectItem>
    //               <SelectItem value="support">Soporte</SelectItem>
    //             </SelectContent>
    //           </Select>
    //         </div>
    //         <div className=" gap-2">
    //           <Label htmlFor="security-level">Nivel de seguridad</Label>
    //           <Select defaultValue="2">
    //             <SelectTrigger
    //               id="security-level"
    //               className="line-clamp-1 w-[260px]"
    //             >
    //               <SelectValue placeholder="Seleccionar nivel" />
    //             </SelectTrigger>
    //             <SelectContent>
    //               <SelectItem value="1">Severidad 1 (Más alta)</SelectItem>
    //               <SelectItem value="2">Severidad 2</SelectItem>
    //               <SelectItem value="3">Severidad 3</SelectItem>
    //               <SelectItem value="4">Severidad 4 (Más baja)</SelectItem>
    //             </SelectContent>
    //           </Select>
    //         </div>
    //       </div>
    //       <div className="grid gap-2">
    //         <Label htmlFor="subject">Asunto</Label>
    //         <Input id="subject" placeholder="Necesito ayuda con..." />
    //       </div>
    //       <div className="grid gap-2">
    //         <Label htmlFor="description">Descripción</Label>
    //         <Textarea
    //           id="description"
    //           placeholder="Por favor, incluye toda la información relevante sobre tu problema."
    //         />
    //       </div>
    //     </CardContent>
    //     <CardFooter className="justify-between space-x-2">
    //       <Button variant="ghost">Cancelar</Button>
    //       <Button>Enviar</Button>
    //     </CardFooter>
    //   </Card>
    // </section>
    <section className="md:mx-7 w-1/2">
      <Card>
        <CardHeader>
          <CardTitle>Reportar un problema</CardTitle>
          <CardDescription>Por favor, describe el problema que estás experimentando</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={asunto}
                onChange={(event) => setAsunto(event.target.value)}
                placeholder="Necesito ayuda con..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Por favor, incluye toda la información relevante sobre tu problema."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between space-x-2">
            <Button variant="ghost">Cancelar</Button>
            <Button type="submit">Enviar</Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  );
}

//!POSIBLE IMPLEMENTACION DE UNA PAGINA DE AYUDA
// import { useState } from 'react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { MessageCircle, Search, Phone, Mail } from 'lucide-react'

// export default function ExpandedHelpCenter() {
//   const [chatOpen, setChatOpen] = useState(false)

//   return (
//     <div className="container mx-auto p-4 space-y-8">
//       <h1 className="text-3xl font-bold">Centro de Ayuda</h1>

//       <Input type="search" placeholder="Buscar artículos de ayuda..." className="max-w-md" />

//       <Tabs defaultValue="report">
//         <TabsList>
//           <TabsTrigger value="report">Reportar un Problema</TabsTrigger>
//           <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
//           <TabsTrigger value="status">Estado del Ticket</TabsTrigger>
//         </TabsList>

//         <TabsContent value="report">
//           <Card>
//             <CardHeader>
//               <CardTitle>Reportar un Problema</CardTitle>
//               <CardDescription>Por favor, describe el problema que estás experimentando</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="subject" className="text-sm font-medium">Asunto</label>
//                 <Input id="subject" placeholder="Necesito ayuda con..." />
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="category" className="text-sm font-medium">Categoría</label>
//                 <select id="category" className="w-full p-2 border rounded">
//                   <option>Selecciona una categoría</option>
//                   <option>Problemas técnicos</option>
//                   <option>Facturación</option>
//                   <option>Cuenta</option>
//                   <option>Otro</option>
//                 </select>
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="description" className="text-sm font-medium">Descripción</label>
//                 <Textarea id="description" placeholder="Por favor, incluye toda la información relevante sobre tu problema." />
//               </div>
//             </CardContent>
//             <CardFooter className="flex justify-between">
//               <Button variant="outline">Cancelar</Button>
//               <Button>Enviar</Button>
//             </CardFooter>
//           </Card>
//         </TabsContent>

//         <TabsContent value="faq">
//           <Accordion type="single" collapsible className="w-full">
//             <AccordionItem value="item-1">
//               <AccordionTrigger>¿Cómo puedo restablecer mi contraseña?</AccordionTrigger>
//               <AccordionContent>
//                 Puedes restablecer tu contraseña haciendo clic en "¿Olvidaste tu contraseña?" en la página de inicio de sesión. Se te enviará un correo electrónico con instrucciones para crear una nueva contraseña.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-2">
//               <AccordionTrigger>¿Cómo actualizo mi información de facturación?</AccordionTrigger>
//               <AccordionContent>
//                 Para actualizar tu información de facturación, ve a la sección "Configuración de la cuenta" y selecciona "Información de facturación". Allí podrás editar tus detalles de pago y dirección de facturación.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-3">
//               <AccordionTrigger>¿Cuál es el tiempo de respuesta típico para los tickets de soporte?</AccordionTrigger>
//               <AccordionContent>
//                 Nuestro tiempo de respuesta típico es de 24 a 48 horas hábiles. Sin embargo, los tiempos pueden variar dependiendo de la complejidad del problema y el volumen actual de tickets.
//               </AccordionContent>
//             </AccordionItem>
//           </Accordion>
//         </TabsContent>

//         <TabsContent value="status">
//           <Card>
//             <CardHeader>
//               <CardTitle>Verificar Estado del Ticket</CardTitle>
//               <CardDescription>Ingresa el número de tu ticket para ver su estado actual</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="ticket-number" className="text-sm font-medium">Número de Ticket</label>
//                 <Input id="ticket-number" placeholder="Ej. TKT-12345" />
//               </div>
//             </CardContent>
//             <CardFooter>
//               <Button>Verificar Estado</Button>
//             </CardFooter>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       <div className="fixed bottom-4 right-4 space-y-2">
//         {chatOpen ? (
//           <Card className="w-80">
//             <CardHeader>
//               <CardTitle>Chat en Vivo</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p>Conectando con un agente...</p>
//             </CardContent>
//             <CardFooter>
//               <Button onClick={() => setChatOpen(false)}>Cerrar Chat</Button>
//             </CardFooter>
//           </Card>
//         ) : (
//           <Button onClick={() => setChatOpen(true)}>
//             <MessageCircle className="mr-2 h-4 w-4" /> Chat en Vivo
//           </Button>
//         )}
//       </div>

//       <footer className="border-t pt-8 mt-8">
//         <h2 className="text-xl font-semibold mb-4">Contáctanos</h2>
//         <div className="flex flex-wrap gap-4">
//           <Card className="w-full sm:w-auto flex-grow">
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Phone className="mr-2" /> Teléfono
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p>+1 (555) 123-4567</p>
//             </CardContent>
//           </Card>
//           <Card className="w-full sm:w-auto flex-grow">
//             <CardHeader>
//               <CardTitle className="flex items-center">
//                 <Mail className="mr-2" /> Correo Electrónico
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p>soporte@ejemplo.com</p>
//             </CardContent>
//           </Card>
//         </div>
//       </footer>
//     </div>
//   )
// }
