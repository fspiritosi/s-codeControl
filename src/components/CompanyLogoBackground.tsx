export const CompanyLogoBackground = () => {
  return (
    <section className="h-full min-h-[300px] flex justify-center items-center md:w-1/2 bg-black/10 w-screen ">
      <div className="relative h-full w-screen md:w-full bg-white">
        <div className="absolute h-full w-screen md:w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>
      <img
        src="/logoNegro.webp"
        alt="imagen del logo"
        className="h-[300px] md:h-[500px]  absolute"
      />
    </section>
  )
}
