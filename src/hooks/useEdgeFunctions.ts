import { supabase } from '../../supabase/supabase'

export const useEdgeFunctions = () => {
  return {
    errorTranslate: async (errorMessage: string) => {
      const { data, error } = await supabase.functions.invoke(
        'errors_translate',
        {
          body: { errorMessage },
        },
      )

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
  }
}
