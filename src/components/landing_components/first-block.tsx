'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Logo_blanco from '../../../public/logoLetrasBlancas.png';
import Logo_negro from '../../../public/logoLetrasNegras.png';
import MotionTransition from './Animation/MotionTransition';
import { Reveal } from './Animation/Reveal';

function FirstBlock() {
  const { theme } = useTheme();
  return (
    <div className="relative p-4 md:py-40">
      <div className="grid max-w-5xl mx-auto md:grid-cols-2">
        <div>
          <Reveal>
            <h1 className="text-2xl md:text-5xl font-semibold">
              Gestioná
              <span className="block text-blue-400">eficientemente</span>
              todos tus procesos
            </h1>
          </Reveal>
          <Reveal>
            <p className="text-xs md:text-xl mt-10 ">
              En CodeControl, nos apasiona ayudar a las empresas a alcanzar sus objetivos. Combinamos{' '}
              <strong>control de procesos, desarrollo de software y consultoría organizacional </strong> para ofrecerte
              soluciones integrales que generan resultados reales.
            </p>
          </Reveal>
          {/* <Reveal>
            <div className="my-8">
              <Link href="/login">
                <Button variant={'primary'}>Empieza ahora</Button>
              </Link>
            </div>
          </Reveal> */}
        </div>
        <MotionTransition className="flex items-center justify-center">
          <Image
            src={theme === 'dark' ? Logo_blanco : Logo_negro}
            alt="imagen de fondo"
            width={450}
            height={450}
            className="h-auto w-72 md:w-full rounded-lg"
          />
        </MotionTransition>
      </div>
    </div>
  );
}

export default FirstBlock;
