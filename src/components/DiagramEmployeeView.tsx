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
  console.log(diagrams)
  const diagraParse = (diagrams:any) => {
    const diamframsToShow : DiamgramParsed[] = []
    //console.log(diagrams)
    diagrams.forEach((d:any) => {
      const fromDate = new Date(d.from_date);
      const toDate = new Date(d.to_date);
      const currentDate = new Date(fromDate);
      const currentEmployee = d.employee_id
      while(currentEmployee === d.employee_id) 
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

  function generarFechas(fromDate:string, toDate:string) {
    let fechas = [];
    let currentDate = new Date(fromDate);
    let endDate = new Date(toDate);

    while (currentDate <= endDate) {
        fechas.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return fechas;
  }

  function generarArrayEmpleados(diagrams:any){
    let agrupadoPorEmpleado:any = {};
    diagrams.forEach((obj:any) => {
        if (!agrupadoPorEmpleado[obj.employee_id]) {
            agrupadoPorEmpleado[obj.employee_id] = [];
        }
        let fechas = generarFechas(obj.from_date, obj.to_date);
        fechas.forEach(fecha => {
            agrupadoPorEmpleado[obj.employee_id].push({
                diagram_type: obj.diagram_type,
                date: fecha,
            });
        });
    });
    let nuevoArray = Object.keys(agrupadoPorEmpleado).map(employee_id => {
      return {
          employee_id: employee_id,
          diagrams: agrupadoPorEmpleado[employee_id]
      };
    });
    
    console.log(nuevoArray)
    return nuevoArray

  }


const diagramEmployees = generarArrayEmpleados(diagrams)


 
  return (
 


    <Table>
      <TableHeader>
      <TableHead >Empleado</TableHead>
      <TableHead>Dia</TableHead>
      </TableHeader>
      <TableBody>
        {diagramEmployees.map((d:any, index:number) => (
          <TableRow key={index}>
            <TableCell>{d.employee_id}</TableCell>
            {d.diagrams.map((o:any, index:number) => (
              <TableCell key={index}>{o.diagram_type.name === "Trabajando Diurno" ? "TD" : o.diagram_type.name === "Trabajando Nocturno" ? "TN" : "F"}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>

    </Table>
    
  )
}

export default DiagramEmployeeView






