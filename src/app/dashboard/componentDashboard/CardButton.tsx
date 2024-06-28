'use client';
type FunctionName =
  | 'setEndorsedEmployees'
  | 'setActivesEmployees'
  | 'noEndorsedEmployees'
  | 'setActivesVehicles'
  | 'endorsedVehicles'
  | 'noEndorsedVehicles';
import { Button } from '@/components/ui/button';
import { useLoggedUserStore } from '@/store/loggedUser';

function CardButton({ functionName }: { functionName: FunctionName }) {
  const { setEndorsedEmployees, setActivesEmployees, noEndorsedEmployees } = useLoggedUserStore((state) => ({
    setEndorsedEmployees: state.endorsedEmployees,
    setActivesEmployees: state.setActivesEmployees,
    noEndorsedEmployees: state.noEndorsedEmployees,
  }));

  const { setActivesVehicles, endorsedVehicles, noEndorsedVehicles } = useLoggedUserStore((state) => ({
    setActivesVehicles: state.setActivesVehicles,
    endorsedVehicles: state.endorsedVehicles,
    noEndorsedVehicles: state.noEndorsedVehicles,
  }));

  const objetFunctions = {
    setEndorsedEmployees,
    setActivesEmployees,
    noEndorsedEmployees,
    setActivesVehicles,
    endorsedVehicles,
    noEndorsedVehicles,
  };
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
