import NewDocumentType from '@/components/NewDocumentType';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function page() {
  return (
    <section className="mt-4 flex flex-col justify-center px-[20vw]">
      <h2 className="text-3xl">Crear un nuevo tipo de documento</h2>
      <p>Aquí podrás crear un nuevo tipo de documento para que los empleados puedan subirlo.</p>
      <Separator className="my-6" />
      {/* <NewDocumentType /> */}
      <Label className="mt-5 text-red-400">
        Antes de guarda debe verificar que no exista otro documento con el mismo nombre
      </Label>
    </section>
  );
}
