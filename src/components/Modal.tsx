import AddBrandModal from './AddBrandModal';
import AddModelModal from './AddModelModal';
import { generic } from './VehiclesForm';

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
  brandOptions?: VehicleBrand[] | null;
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
