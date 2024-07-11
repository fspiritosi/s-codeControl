import { profileUser } from '@/types/types';
import { supabase } from '../../supabase/supabase';
import { useEdgeFunctions } from './useEdgeFunctions';

export const useProfileData = () => {
  const { errorTranslate } = useEdgeFunctions();
  return {
    insertProfile: async (credentials: profileUser) => {
      const { firstname, lastname, ...rest } = credentials;
      const { data, error } = await supabase
        .from('profile')
        .insert({
          ...rest,
          fullname: `${lastname} ${firstname}`,
        })
        .select();

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    filterByEmail: async (email: string | null) => {
      const { data, error } = await supabase.from('profile').select('*').eq('email', email);

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }

      return data;
    },
  };
};
