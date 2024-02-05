import React from 'react'
import Modal from 'react-modal'
import { company } from '@/types/types'
import { formatCompanyName } from '@/lib/utils'
type ModalCompanyProps = {
  isOpen: boolean
  onClose: () => void
  selectedCard: company | null
}

const ModalCompany: React.FC<ModalCompanyProps> = ({
  isOpen,
  onClose,
  selectedCard,
}) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      {selectedCard && (
        <div className="flex flex-col h-full">
          <button onClick={onClose} className="self-end p-2">
            X
          </button>
          <div className="flex flex-1">
            <div className="flex-1 p-4">
              <h2 className="text-2xl font-bold">
                {formatCompanyName(selectedCard.company_name)}
              </h2>
              <p>{selectedCard.description}</p>
            </div>
            <div className="w-1/3 p-4">
              <img
                src={selectedCard.company_logo}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ModalCompany
