import NewDocumentMulti from './Documents/NewDocumentMulti';
import NewDocumentNoMulti from './Documents/NewDocumentNoMulti';
export default function DocumentNav({
  empleados,
  onlyNoMultiresource,
  equipment,
  mandatoryLabel,
  documentNumber,
}: {
  empleados?: boolean;
  equipment?: boolean;
  onlyNoMultiresource?: boolean;
  mandatoryLabel?: string;
  documentNumber?: string;
}) {
  return (
    <>
      {<NewDocumentMulti />}
      {<NewDocumentNoMulti />}
    </>
  );
}
