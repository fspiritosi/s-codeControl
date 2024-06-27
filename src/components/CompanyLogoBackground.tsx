import Image from 'next/image';
import Link from 'next/link';

export const CompanyLogoBackground = () => {
  return (
    <section className="h-full min-h-[300px] flex justify-center items-center md:w-1/2  w-screen ">
      <div>
        <Link href={'/'}>
          <Image src="/bg-fondo.png" alt="imagen de fondo" width={650} height={650} />
        </Link>
      </div>
    </section>
  );
};
