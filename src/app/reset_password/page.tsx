import { RecoveryPasswordForm } from '@/components/RecoveryPasswordForm';

import RenderBanner from '@/components/RenderBanner';
import { CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
export default function PasswordRecovery() {
  return (
    <section className="min-h-screen overflow-hidden bg-white dark:bg-transparent">
      <div className="container relative flex-col grid-cols-1 justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0  md:px-2 p-0">
        <RenderBanner />
        <div className="lg:p-8 relative z-50   md:p-8 pt-7 p-0 flex flex-col justify-center items-center w-full">
          <Link className="relative z-20 lg:hidden items-center font-bold text-2xl flex" href="/">
            <Image
              src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png"
              alt="Logo de codecontrol"
              className="size-12 mr-4"
              width={120}
              height={120}
            />
            CodeControl
          </Link>
          <div className="w-full overflow-y-auto ">
            <CardTitle className="text-3xl font-semibold tracking-tight lg:text-left text-center mb-5 text-balance">
              ¿Olvidaste tu contraseña? No te preocupes, te ayudaremos a restablecerla.
            </CardTitle>
            <RecoveryPasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
