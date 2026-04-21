import React from 'react'
type EditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};
export default function EditModal({ isOpen, onClose, children }: EditModalProps) {
  
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg  text-black dark:text-white">
                {/* <button onClick={onClose} className="absolute top-2 right-2">Cerrar</button> */}
                {children}
            </div>
        </div>
  )
}
