'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function RefreshComponent() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, []);

  return <></>;
}

export default RefreshComponent;
