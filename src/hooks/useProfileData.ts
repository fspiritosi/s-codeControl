import { profileUser } from '@/types/types';
import {
  insertProfileServer,
  fetchProfileByEmailServer,
} from '@/app/server/UPDATE/actions';
import { useEdgeFunctions } from './useEdgeFunctions';

export const useProfileData = () => {
  const { errorTranslate } = useEdgeFunctions();
  return {
    insertProfile: async (credentials: profileUser) => {
      const { firstname, lastname, ...rest } = credentials;
      const { data, error } = await insertProfileServer({
        ...rest,
        fullname: `${lastname} ${firstname}`,
      });

      if (error) {
        const message = await errorTranslate(error);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    filterByEmail: async (email: string | null) => {
      if (!email) return [];
      const data = await fetchProfileByEmailServer(email);
      return data;
    },
  };
};
