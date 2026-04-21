import { cookies } from 'next/headers';
import AutenticationDark from './AutenticationDark';
import AutenticationLight from './AutenticationLight';
import RefreshComponent from '@/modules/landing/features/auth/components/RefreshComponent';

async function RenderBanner() {
  const cookiesStore = await cookies();
  const theme = cookiesStore.get('theme');
  return (
    <>
      <RefreshComponent />
      {theme?.value == 'dark' ? <AutenticationDark /> : <AutenticationLight />}
    </>
  );
}

export default RenderBanner;
