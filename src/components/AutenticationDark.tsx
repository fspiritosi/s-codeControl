import Image from 'next/image';
import Link from 'next/link';

function AutenticationDark() {
  return (
    <div className=" dark:z-40 hidden flex-col bg-muted p-10  lg:flex dark:border-r min-h-screen text-black dark:bg-neutral-950 ">
      <div className="absolute border-r-white/15 border-r-2 top-0 left-0 h-full w-full  bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <Link className="relative z-20 flex items-center font-bold text-2xl dark:text-white" href="/">
        <Image
          src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/logo/24417298440.png"
          alt="Logo de codecontrol"
          className=" size-12 mr-4 relative z-40"
          width={120}
          height={120}
        />
        CodeControl
      </Link>
      <div className="relative z-20 mt-auto ">
        <blockquote className="space-y-2">
          <p className="text-xl bg-transparent text-pretty dark:text-white">
            Combinamos control de procesos, desarrollo de software y consultoría organizacional para ofrecerte
            soluciones integrales que generan resultados reales.
          </p>
          <footer className="text-md dark:text-white">CodeControl</footer>
        </blockquote>
      </div>
    </div>
  );
}

export default AutenticationDark;
