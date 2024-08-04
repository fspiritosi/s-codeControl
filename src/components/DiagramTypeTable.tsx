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
  
  const invoices = [
    {
      invoice: "INV001",
      paymentStatus: "Paid",
      totalAmount: "$250.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV002",
      paymentStatus: "Pending",
      totalAmount: "$150.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV003",
      paymentStatus: "Unpaid",
      totalAmount: "$350.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV004",
      paymentStatus: "Paid",
      totalAmount: "$450.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV005",
      paymentStatus: "Paid",
      totalAmount: "$550.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV006",
      paymentStatus: "Pending",
      totalAmount: "$200.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV007",
      paymentStatus: "Unpaid",
      totalAmount: "$300.00",
      paymentMethod: "Credit Card",
    },
  ]


  
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
  