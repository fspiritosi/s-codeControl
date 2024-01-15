'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/supabase/supabase'
import { Button } from './ui/button'
export default function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Verifico el estado de autenticación al cargar la página
    const session = supabase.auth.getSession()

    setIsAuthenticated(!!session)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      console.log('Sesión cerrada con éxito')
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <nav className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-md mb-2">
      <div className="flex items-center">
        <Link href="/" passHref className="text-white text-2xl font-bold">
          Home
        </Link>
      </div>

      <div className="flex items-center">
        {isAuthenticated ? (
          <Button onClick={handleLogout} className="text-white bg-blue-300">
            Cerrar Sesión
          </Button>
        ) : (
          <p>Usuario no autenticado</p>
        )}
      </div>
    </nav>
  )
}
