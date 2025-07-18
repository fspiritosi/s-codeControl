import { getPendingRequests } from '../actions/actions';
import AcceptPage from './PortalPage';

async function PortalEmployeeWrapper() {
  const portalUsers = await getPendingRequests();
  // const approvedUsers = await getApprovedUsers();
  console.log(portalUsers, 'pendingRequests');

  return (
    <AcceptPage
      pendingRequests={portalUsers.filter(
        (user) =>
          (user.raw_user_meta_data as any)?.data_confirmed === true &&
          (user.raw_user_meta_data as any)?.verified === false
      )}
      approvedUsers={portalUsers.filter(
        (user) =>
          (user.raw_user_meta_data as any)?.verified === true &&
          (user.raw_user_meta_data as any)?.data_confirmed === true
      )}
    />
  );
}

export default PortalEmployeeWrapper;
