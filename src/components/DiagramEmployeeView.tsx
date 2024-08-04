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

function DiagramEmployeeView({diagrams, activeEmployees}:{diagrams:any, activeEmployees:any}) {

  function generarDiasEntreFechas({fechaInicio, fechaFin}:{fechaInicio:Date, fechaFin:Date}) {
    const dias = [];
    let fechaActual = new Date(fechaInicio);
  
    while (fechaActual <= new Date(fechaFin)) {
      dias.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
  
    return dias;
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

  function generarArrayEmpleados(diagrams:any) {
    let agrupadoPorEmpleado:any = {};
    diagrams.forEach((obj:any) => {
      if (!agrupadoPorEmpleado[obj.employee_id]) {
        agrupadoPorEmpleado[obj.employee_id] = {
          employee_name: obj.employees.firstname + ' ' + obj.employees.lastname, // Asegúrate de que el nombre del empleado esté disponible en el objeto
          diagrams: []
        };
      }
      let fechas = generarFechas(obj.from_date, obj.to_date);
      fechas.forEach(fecha => {
        agrupadoPorEmpleado[obj.employee_id].diagrams.push({
          diagram_type: obj.diagram_type,
          date: fecha,
        });
      });
    });
  
    let nuevoArray = Object.keys(agrupadoPorEmpleado).map(employee_id => {
      return {
        employee_id: employee_id,
        employee_name: agrupadoPorEmpleado[employee_id].employee_name,
        diagrams: agrupadoPorEmpleado[employee_id].diagrams,
      };
    });
  
    return nuevoArray;
  }


const diagramEmployees = generarArrayEmpleados(diagrams)

const fechaInicio = new Date('2024/06/28');
const fechaFin = new Date('2024/07/15');

const mes = generarDiasEntreFechas({fechaInicio, fechaFin})

  return (
    <Table>
      <TableHeader>
      <TableHead >Empleado</TableHead>
        {mes.map((d, index) => (<TableHead key={index}>{(d.getDate()) + '/' + (d.getMonth() + 1) }</TableHead>))}
      </TableHeader>
      <TableBody>
        {diagramEmployees.map((d:any, index:number) => (
          <TableRow key={index}>
            <TableCell>{d.employee_name}</TableCell>
            {mes.map(day => {
              const diagram = d.diagrams.find((d:any )=> new Date(d.date).toLocaleDateString() === day.toLocaleDateString())                       
              return <TableCell key={index} className='text-center' style={{ backgroundColor: diagram?.diagram_type.color }}>{diagram?.diagram_type.short_description}</TableCell>
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
  )
}

export default DiagramEmployeeView
