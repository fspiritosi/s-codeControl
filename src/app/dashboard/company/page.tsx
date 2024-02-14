'use client'
import React, { useState, useEffect } from 'react'
import { CardsGrid } from '../../../components/CardsGrid'
import { useLoggedUserStore } from '@/store/loggedUser'
import ModalCompany from '@/components/ModalCompany'
import { company } from '@/types/types'
import Modal from 'react-modal'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../supabase/supabase'

function setupModalAppElement() {
  if (window.document) {
    Modal.setAppElement('body')
  }
}

export default function allCompany() {
  const router = useRouter()

  useEffect(() => {
    setupModalAppElement()
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company' },
        payload => {
          console.log('Change received!', payload)
          fetchCompanies()
        },
      )
      .subscribe()

    // return () => {
    //   subscription.unsubscribe()
    // }
  }, [])

  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<company | null>(null)
  const allCompanies = useLoggedUserStore(state => state.allCompanies)

  const handleCardClick = (card: any) => {
    setSelectedCard(card)
    setModalIsOpen(true)
  }

  const clearSelectedCard = () => {
    setSelectedCard(null)
  }

  const handleCloseModal = () => {
    setModalIsOpen(false)
    router.refresh()
  }

  const fetchCompanies = async () => {
    // Obtener las compañías actualizadas de Supabase
    const { data, error } = await supabase.from('company').select('*')
    if (error) {
      console.error('Error al obtener las compañías:', error)
    } else {
      // Actualizar el estado global con las nuevas compañías
      useLoggedUserStore.setState({ allCompanies: data || [] })
    }
  }

  if (!allCompanies) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando...</div>
      </div>
    )
  }

  return (
    <main className="bg-white">
      <h2 className="text-3xl pb-5 pl-10">Todas las Compañias</h2>
      <p className="pl-10 max-w-1/2">Aquí se verán todas las compañías</p>
      <div className="bg-slate-400 rounded-lg shadow-md p-4">
        <CardsGrid allCompanies={allCompanies} onCardClick={handleCardClick} />
      </div>

      {modalIsOpen && (
        <ModalCompany
          isOpen={modalIsOpen}
          onClose={handleCloseModal}
          selectedCard={selectedCard}
        />
      )}
    </main>
  )
}
