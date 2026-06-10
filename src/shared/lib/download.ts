"use client"

import { storage } from "./storage"
import { blobWithResolvedType } from "./mime"

export async function downloadFile(filePath: string, fileName: string) {
  // Verificar si estamos en el navegador
  if (typeof window === 'undefined') {
    console.error('downloadFile solo puede ser llamado desde el lado del cliente')
    throw new Error('downloadFile solo puede ser llamado desde el lado del cliente')
  }

  try {
    const data = await storage.download('documents-hse', filePath)

    const url = window.URL.createObjectURL(blobWithResolvedType(data, fileName))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()

    // Limpiar después de la descarga
    window.URL.revokeObjectURL(url)
    link.remove()
  } catch (error) {
    console.error('Error en downloadFile:', error)
    throw error
  }
}
