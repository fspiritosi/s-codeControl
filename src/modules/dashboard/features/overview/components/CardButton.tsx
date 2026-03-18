'use client';
type FunctionName =
  | 'setEndorsedEmployees'
  | 'setActivesEmployees'
  | 'noEndorsedEmployees'
  | 'setActivesVehicles'
  | 'endorsedVehicles'
  | 'noEndorsedVehicles';
import { Button } from '@/shared/components/ui/button';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { useShallow } from 'zustand/react/shallow';

function CardButton({ functionName }: { functionName: FunctionName }) {
  const objetFunctions = useLoggedUserStore(
    useShallow((state) => ({
      setEndorsedEmployees: state.endorsedEmployees,
      setActivesEmployees: state.setActivesEmployees,
      noEndorsedEmployees: state.noEndorsedEmployees,
      setActivesVehicles: state.setActivesVehicles,
      endorsedVehicles: state.endorsedVehicles,
      noEndorsedVehicles: state.noEndorsedVehicles,
    }))
  );

  return (
    <Button
      variant="primary"
      onClick={() => {
        objetFunctions[functionName]();
      }}
    >
      ver todos
    </Button>
  );
}

export default CardButton;
