import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'

export const DocumentationDrawer = () => {
  const documentation = [
    'Documento 1.pdf',
    'Documento 2.pdf',
    'Documento 3.pdf',
    'Documento 4.pdf',
    'Documento 5.pdf',
  ]
  return (
    <aside className="bg-slate-800 w-[20%] h-full rounded-2xl  text-white p-4">
      <h2 className="text-center text-xl mb-5">Documentación del empleado</h2>
      <p className="pl-2">
        <Checkbox className="bg-white" /> seleccionar todos
      </p>
      <Separator className="mb-4" />
      <div className="h-full flex flex-col justify-between p-3">
        <ul className="flex flex-col gap-3">
          {documentation.map((doc, index) => (
            <li key={index} className="flex items-center gap-2 ">
              <Checkbox className="bg-white" />
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>
      <Separator className="my-4" />
      <footer className="bg-white p-4 text-black rounded-2xl flex flex-col justify-center items-center">
        <h3>5 documentos seleccionados</h3>
        <Button>Descargar seleccionados</Button>
      </footer>
    </aside>
  )
}
