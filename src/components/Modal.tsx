import AddBrandModal from './AddBrandModal';
import AddModelModal from './AddModelModal';

export function Modal({
  children,
  modal,
  fetchData,
  brandOptions,
  fetchModels,
}: {
  children: React.ReactNode;
  modal: string;
  fetchData?: () => Promise<void>;
  brandOptions?: { label: string; id: string }[];
  fetchModels?: (brand_id: string) => Promise<void>;
}) {
  return (
    <>
      {modal === 'addBrand' && fetchData && <AddBrandModal fetchData={fetchData}>{children}</AddBrandModal>}
      {modal === 'addModel' && brandOptions && (
        <AddModelModal fetchModels={fetchModels} brandOptions={brandOptions}>
          {children}
        </AddModelModal>
      )}
    </>
  );
}
