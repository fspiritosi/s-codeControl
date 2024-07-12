import AddCovenantModal from './AddCovenantModal';
import AddCategoryModal from './AddCategoryModal';

export function ModalCct({
  children,
  modal,
  fetchData,
  covenantOptions,
  fetchCategory,
  covenant_id
}: {
  children: React.ReactNode;
  modal: string;
  fetchData?: () => Promise<void>;
  covenantOptions?: { name: string; id: string }[];
  fetchCategory?: (name: string) => Promise<void>;
  covenant_id?: string;
}) {
  return (
    <>
      {modal === 'addCovenant' && fetchData && <AddCovenantModal fetchData={fetchData}>{children}</AddCovenantModal>}
      {modal === 'addCategory' && covenantOptions && (
        <AddCategoryModal fetchCategory={fetchCategory} covenant_id ={covenant_id as any} covenantOptions={covenantOptions}>
          {children}
        </AddCategoryModal>
      )}
    </>
  );
}
