'use client'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
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


import { DotsHorizontalIcon } from "@radix-ui/react-icons"
 
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { DiagramNewTypeForm } from "./DiagramNewTypeForm"
import { useEffect, useState } from "react"
import { link } from "fs"



function DiagramTypeComponent({diagrams_types}:{diagrams_types:[]}) {

  const [selectDiagramType, setSelectDiagramType] = useState<{}>({})

  function setDiagram (data:any){
    console.log('click me')
    setSelectDiagramType(data)
      }

  console.log(selectDiagramType)

  useEffect(() => {
    setSelectDiagramType({})
  }, [])
  
  return (
    
        <ResizablePanelGroup direction="horizontal" className="pt-6">
        <ResizablePanel> 
            <DiagramNewTypeForm selectedDiagram={selectDiagramType} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="pl-6 min-w-[600px]" defaultSize={70}>
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
                {diagrams_types.map((diagramType:any) => (
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
                    <TableCell>
                        <div className="flex gap-2 justify-center">
                        <Button size={"sm"} variant={"link"} className="hover:text-blue-400" onClick={() => setDiagram(diagramType)}>Editar</Button>
                        <Button size={"sm"} variant={"link"} className="hover:text-red-500">Eliminar</Button>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </ResizablePanel>
        </ResizablePanelGroup>
   
  )
}

export default DiagramTypeComponent