import Link from 'next/link'
import React from 'react'

export default function Auditor() {
  return (
    <section>
      <h2 className="text-blue-500">Hola auditor!</h2>
      <Link href="/auditor/new-document-type" className="underline">
        Nuevo Documento
      </Link>
    </section>
  )
}
