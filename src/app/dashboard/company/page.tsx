'use client'
import React, { useState } from 'react'
import { CardsGrid } from '../../../components/CardsGrid'
import { useLoggedUserStore } from '@/store/loggedUser'
import ModalCompany from '@/components/ModalCompany'
import { company } from '@/types/types'

export default function allCompany() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<company | null>(null)

  const handleCardClick = (card: any) => {
    setSelectedCard(card)
    setModalIsOpen(true)
  }

  const clearSelectedCard = () => {
    setSelectedCard(null)
  }

  const handleCloseModal = () => {
    setModalIsOpen(false)
  }

  if (!allCompanies) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando...</div>
      </div>
    )
  }

  return (
    <main className="bg-slate-400">
      <h2 className="text-3xl pb-5 pl-10">Todas las Compañias</h2>
      <p className="pl-10 max-w-1/2">Aquí se verán todas las compañías</p>
      <div className="bg-white rounded-lg shadow-md p-4">
        <CardsGrid companies={allCompanies} onCardClick={handleCardClick} />
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
