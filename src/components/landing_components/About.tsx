'use client';

import { LightBulbIcon, MapIcon, MedalIcon } from '@/components/Icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MotionTransition from './Animation/MotionTransition';
import { Reveal } from './Animation/Reveal';

function AboutAs() {
  return (
    <MotionTransition className="max-w-5xl px-4 py-10 mx-auto md:py-32">
      <div className="justify-between gap-4  mb-4">
        <Reveal>
          <h2 className="text-4xl font-semibold mb-8 text-blue-500">
            Quienes Somos?
            {/* <span className="block text-blue-300 text-5xl">Quienes Somos?</span> */}
          </h2>
        </Reveal>
        <Reveal>
          <p>
            <strong>CodeControl</strong> nace como una empresa dedicada a ayudar a las empresas a gestionar sus recursos
            de forma eficiente. Nuestra plataforma permite centralizar y mantener actualizada toda la información de tus
            equipos y empleados, así como sus documentos y archivos.
          </p>
          <p className="mt-2">
            La gestión documental es un proceso complejo y crítico. Los documentos deben ser precisos, actualizados y
            fácilmente accesibles para garantizar la seguridad, el cumplimiento y la eficiencia. Sin embargo, las
            empresas PyME a menudo carecen de los recursos o la experiencia para gestionar sus documentos de manera
            efectiva.
          </p>
        </Reveal>
      </div>
      <div className="justify-between gap-4 md:flex-col">
        <Reveal>
          <h2 className="text-2xl font-semibold my-8 text-blue-500">Que ofrecemos?</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2">Centraliza la información:</CardHeader>
            <CardDescription>
              Todos los documentos de tu empresa se encuentran en un único lugar, accesible desde cualquier dispositivo.
            </CardDescription>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2">Mantén la información actualizada:</CardHeader>
            <CardDescription>
              {' '}
              Recibe notificaciones cuando se modifique un documento o se agregue un nuevo archivo.
            </CardDescription>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2">Facilita la búsqueda:</CardHeader>
            <CardDescription>
              {' '}
              Encuentra la información que necesitas en segundos mediante un potente motor de búsqueda.
            </CardDescription>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2">Protege tus datos:</CardHeader>
            <CardDescription>
              Mantenemos tus archivos seguros y confidenciales con los más altos estándares de seguridad.
            </CardDescription>
          </Card>
        </div>
      </div>
      <div className="justify-between gap-4 md:flex-col">
        <Reveal>
          <h2 className="text-2xl font-semibold my-8 text-blue-500">Porque Elegirnos?</h2>
        </Reveal>
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2 items-center">
              <div className="w-[50px] h-[50px] mb-2">
                <MedalIcon />
                {/* <FaBookOpen className="w-full h-full" /> */}
              </div>
              <CardTitle className="text-blue-400">Experiencia</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-2">
              <CardDescription className="w-full">
                Entendemos los desafíos específicos de la gestión documental con +15 años de realizarlo en la industria
                de Oil&Gas
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2 items-center">
              <div className="w-[50px] h-[50px] mb-2">
                <LightBulbIcon />
                {/* <TbWorldCode className="w-full h-full"  /> */}
              </div>
              <CardTitle className="text-blue-400">Tecnología innovadora</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-2">
              <CardDescription className="w-full">
                Nuestra plataforma está desarrollada con la última tecnología para ofrecerte la mejor experiencia
                posible
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2 items-center">
              <div className="w-[50px] h-[50px] mb-2">
                <MapIcon />

                {/* <RiCustomerService2Line className="w-full h-full" /> */}
              </div>
              <CardTitle className="text-blue-400">Atención al cliente</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-2">
              <CardDescription className="w-full">
                Ofrecemos un servicio de atención al cliente personalizado para ayudarte a sacar el máximo provecho de
                nuestra plataforma
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="p-4 hover:scale-110 cursor-pointer">
            <CardHeader className="p-2 items-center">
              <div className="w-[50px] h-[50px] mb-2">
                <LightBulbIcon />
                {/* <FaHandsHelping className="w-full h-full" /> */}
              </div>
              <CardTitle className="text-blue-400">Compromiso</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-2">
              <CardDescription className="w-full">
                Estamos comprometidos a colaborar de manera proactiva con nuestros clientes para ayudarlos a alcanzar
                sus objetivos.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </MotionTransition>
  );
}

export default AboutAs;
