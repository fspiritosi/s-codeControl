import NewDocumentMulti from './Documents/NewDocumentMulti';
import NewDocumentNoMulti from './Documents/NewDocumentNoMulti';
export default function DocumentNav({
  onlyEmployees,
  onlyNoMultiresource,
  onlyMultiresource,
  onlyEquipment,
  id_user,
}: {
  onlyEmployees?: boolean;
  onlyEquipment?: boolean;
  onlyNoMultiresource?: boolean;
  onlyMultiresource?: boolean;
  id_user?: string;
}) {
  return (
    <div className="flex gap-2">
      {!onlyNoMultiresource && <NewDocumentMulti onlyEmployees={onlyEmployees} onlyEquipment={onlyEquipment} />}
      {!onlyMultiresource && (
        <NewDocumentNoMulti id_user={id_user} onlyEmployees={onlyEmployees} onlyEquipment={onlyEquipment} />
      )}
    </div>
  );
}
