'use client'
import NewDocumentModal from '@/components/NewDocumentModal'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useLoggedUserStore } from '@/store/loggedUser'
export default function DocumentNav() {
  const profile = useLoggedUserStore(state => state)
  let role = ""
  if(profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id){
     role = profile?.actualCompany?.owner_id?.role as string
     
  }else{
     role = profile?.actualCompany?.share_company_users?.[0]?.role as string
  }
  const [multiresource, setMultiresource] = useState<boolean | undefined>(
    undefined,
  )
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleMultiResource = (boolean: boolean) => {
    setMultiresource(boolean)
    setIsOpen(true)
  }
  return (
    <>
      {(role !== "Invitado") && (
      <Button onClick={() => handleMultiResource(true)}>
        Documento multirecurso
      </Button>
       )}
      {(role !== "Invitado") && (
      <Button onClick={() => handleMultiResource(false)}>
        Documento no multirecurso
      </Button>
       )} 
      <NewDocumentModal
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        multiresource={multiresource}
      />
    </>
  )
}
