'use client'
import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger, DialogTitle, DialogClose } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useState } from 'react'
import { useLoggedUserStore } from '@/shared/store/loggedUser'

export default function DangerZoneComponent() {

  

    const company = useLoggedUserStore((state) => state.actualCompany);
    const [verify, setVerify] = useState(false);
    
    function compare(text: string) {
        if (text === company?.company_name) {
          setVerify(true);
        } else {
          setVerify(false);
        }
      }
  return (
    <div>
    
            <Card className=" bg-red-300 border-red-800 border-spacing-2 border-2">
              <CardHeader>ZONA PELIGROSA</CardHeader>
              <CardContent>
                <p>Al eliminiar esta empresa se eliminarán todos los registros asociado a ella.</p>
                <p>Esta acción no se puede deshacer.</p>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-red-500 bg-opacity-80 border-red-700 border-2 text-red-700 hover:bg-red-700 hover:text-red-500"
                    >
                      Eliminar Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar eliminación de la empresa</DialogTitle>
                      <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col">
                      <p>
                        Por favor escribe <strong>{company?.company_name}</strong> para confirmar.
                      </p>
                      <div className="grid flex-1 gap-2">
                        <Input
                          id="user_input"
                          type="text"
                          onChange={(e) => compare(e.target.value)}
                          className={
                            verify
                              ? 'border-green-400 bg-green-300 text-green-700'
                              : 'focus:border-red-400 focus:bg-red-300 text-red-700'
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cerrar
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button type="button" variant="destructive">
                          Eliminar
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          

    </div>
  )
}
