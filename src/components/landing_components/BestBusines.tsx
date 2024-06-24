import { ChatIcon, DactilarIcon, SearchIcon } from '@/components/Icons';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Reveal } from './Animation/Reveal';

function Services() {
  return (
    <div className="relative px-6 py-20 md:py-64">
      {/* aca puede ir un background */}
      <div className="grid max-w-5xl mx-auto md:grid-cols-2">
        <div>
          <Reveal>
            <h2 className="text-3xl font-semibold">
              <span className="block text-blue-300 text-5xl">Carga tus recursos</span>
              <br />
              Te ayudamos a mantenerlos actualizados
            </h2>
          </Reveal>
          <Reveal>
            <p className="max-w-md mt-10">
              Olvídate de las carpetas desorganizadas, los documentos duplicados y las versiones obsoletas. Con{' '}
              <strong>codeControl</strong>, podrás centralizar y gestionar todos tus recursos de forma eficiente.
            </p>
            <p>Nuestro sistema de reporte y notificaciones te ayudará a gestionar con anticipación los vencimientos.</p>
          </Reveal>
          <Reveal>
            <div className="my-8">
              <Link href="#servicios">
                <Button variant="outline" size="lg" className="font-bold">
                  Contactanos
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="grid items-center py-5 md:p-8">
          <Reveal>
            <div className="grid grid-flow-col gap-5 px-4 py-2 rounded-3xl group ">
              <div className="">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-[50px] h-[50px]">
                    <DactilarIcon />
                  </div>
                  <h4 className="text-xl font-bold">100% Seguro</h4>
                </div>
                <p className="text-gray-500">
                  Tu información y documentos se guardan de manera segura en nuestras bases de datos.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="grid grid-flow-col gap-5 px-4 py-2 rounded-3xl group">
              <div className="">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-[50px] h-[50px]">
                    <ChatIcon />

                    {/* <MdOutlineWhatsapp className="w-full h-full" /> */}
                  </div>
                  <h4 className="text-xl font-bold">Notificaciones</h4>
                </div>
                <p className="text-gray-500">
                  A travez de nuestro sistema de notificaciones y alertas estarás siempre informado de tus vencimientos.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="grid grid-flow-col gap-5 px-4 py-2 rounded-3xl group">
              <div className="">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-[50px] h-[50px]">
                    <SearchIcon />
                    {/* <MdOutlinePolicy className="w-full h-full" /> */}
                  </div>
                  <h4 className="text-xl font-bold">Auditoría</h4>
                </div>
                <p className="text-gray-500">
                  Auditamos tu documentación para asegurarte que cumpla con todos los requisitos legales
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export default Services;
