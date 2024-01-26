import { profileUser } from '@/types/types'
import { User } from '@supabase/supabase-js'
import create from 'zustand'
import { supabase } from '../../supabase/supabase'


interface State {
    credentialUser: User | null
    profile: profileUser[]
    showAlert: boolean
}

export const useLoggedUserStore = create<State>((set, get) => {
    const loggedUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
    
        if (user) {
          set({ credentialUser: user })
        }
        
        const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('credential_id', user?.id)
        if (error) {
          console.error('Error al obtener el perfil:', error)
        } else {
          set({ profile: data as profileUser[]  || [] })
          if (data?.[0].company_id === null || data?.[0].company_id === undefined) {
            set({ showAlert: true })
          } else {
            set({ showAlert: false })
          }
        }
        
      } 
      loggedUser()

  return {
      credentialUser: get()?.credentialUser,
      profile: get()?.profile,
      showAlert : get()?.showAlert,
  }
})
