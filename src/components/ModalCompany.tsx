import { formatCompanyName } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { company } from '@/types/types';
import React, { useState } from 'react';
import Modal from 'react-modal';
import { CompanyRegister } from './CompanyRegister'; // Importa tu formulario de registro de compañía
import { Button } from './ui/button';
type ModalCompanyProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCard: company | null;
};

const ModalCompany: React.FC<ModalCompanyProps> = ({ isOpen, onClose, selectedCard }) => {
  const [formEnabled, setFormEnabled] = useState(false);

  const toggleFormEnabled = () => {
    setFormEnabled((prevState) => !prevState);
  };
  const handleCloseModal = () => {
    onClose();
  };
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <div className="text-black">
        {selectedCard && (
          <div className="flex flex-col h-full">
            <Button onClick={handleCloseModal} className="self-end p-2">
              X
            </Button>
            <div className="flex  flex-1">
              <div className="flex-1 p-4">
                <h2 className="text-2xl font-bold">{formatCompanyName(selectedCard.company_name)}</h2>
                <p>{selectedCard.description}</p>
              </div>
              <div className="w-1/3  p-4">
                <img
                  src={selectedCard.company_logo}
                  className="max-w-full h-auto"
                  alt="Company Logo"
                  width={150}
                  height={70}
                />
              </div>
            </div>
            <Button variant="primary" onClick={toggleFormEnabled}>
              {formEnabled ? 'Deshabilitar Edición' : 'Habilitar Edición'}
            </Button>
            <br />
            <CompanyRegister company={selectedCard} formEnabled={formEnabled} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalCompany;
