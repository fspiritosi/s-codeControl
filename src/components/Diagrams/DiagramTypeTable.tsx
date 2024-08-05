import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
    
  export async function  DiagramTypeTable( {diagramsType}:{diagramsType:any}) {

   
    return (
      <Table>
        <TableCaption>Lista de novedades de diagrama</TableCaption>
        <TableHeader>
          <TableRow>
           
            <TableHead >Nombre de la Novedad</TableHead>
            <TableHead className="w-[100px]">Color</TableHead>
            <TableHead>Descripción Corta</TableHead>
            <TableHead >Vista Previa</TableHead>
            <TableHead ></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diagramsType.map((diagramType:any) => (
            <TableRow key={diagramType.name}>
                
              <TableCell>{diagramType.name}</TableCell>

              <TableCell>
                <div className={`rounded-full w-5 h-5 border`} style={{ backgroundColor: diagramType.color }}></div>
              </TableCell>
              <TableCell>{diagramType.short_description}</TableCell>
              <TableCell>
                <div className="w-10 h-10 flex justify-center items-center" style={{ backgroundColor: diagramType.color }}>
                {diagramType.short_description}
                </div>
              </TableCell>
              <TableCell>...</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  