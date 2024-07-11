import AddCovenantModal from './AddCovenantModal';
import AddCategoryModal from './AddCategoryModal';

export function ModalCct({
  children,
  modal,
  fetchData,
  covenantOptions,
  fetchCategory,
}: {
  children: React.ReactNode;
  modal: string;
  fetchData?: () => Promise<void>;
  covenantOptions?: { name: string; id: string }[];
  fetchCategory: (name: string) => Promise<void>;
}) {
  return (
    <>
      {modal === 'addCovenant' && fetchData && <AddCovenantModal fetchData={fetchData}>{children}</AddCovenantModal>}
      {modal === 'addCategory' && covenantOptions && (
        <AddCategoryModal fetchCategory={fetchCategory} covenantOptions={covenantOptions}>
          {children}
        </AddCategoryModal>
      )}
    </>
  );
}
