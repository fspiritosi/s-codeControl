import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


type DiamgramParsed = {
  name: string,
  lastName: string,
  diagram_type: string,
  date: string
}

function DiagramEmployeeView({diagrams}:{diagrams:any}) {

  const diagraParse = (diagrams:any) => {
    const diamframsToShow : DiamgramParsed[] = []
    diagrams.forEach((d:any) => {
      const fromDate = new Date(d.from_date);
      const toDate = new Date(d.to_date);
      const currentDate = new Date(fromDate);

      while(currentDate <= toDate){
        diamframsToShow.push({
          name: d.employees.firstname,
          lastName: d.employees.lastname,
          diagram_type: d.diagram_type.name,
          date:currentDate.toLocaleDateString()
        });
        currentDate.setDate(currentDate.getDate()+1)
      }
    })
    return diamframsToShow
  }

  const parseDiagram = diagraParse(diagrams)
 
  return (

    <Table>
      <TableCaption>Diagramas de tus empleados</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead >Empleado</TableHead>
          <TableHead>Tipo Novedad</TableHead>
          <TableHead className="text-center">Inicio</TableHead>
         
        </TableRow>
      </TableHeader>
      <TableBody>
        {parseDiagram.map((d:any, index:number) => (
          <TableRow key={index}>
          <TableCell className="font-medium">{d.name +" "+ d.lastName}</TableCell>
          <TableCell>{d.diagram_type}</TableCell>
          <TableCell className="text-center">{d.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>  
    </Table>
    
  )
}

export default DiagramEmployeeView






