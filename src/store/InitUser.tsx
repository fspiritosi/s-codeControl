'use client'
import { User } from '@supabase/supabase-js'
import { useEffect, useRef } from 'react'
import { useLoggedUserStore } from './loggedUser'

export default function InitUser({ user }: { user: User | undefined }) {
  const initState = useRef(false)
  //   const profileUser = useLoggedUserStore(state => state.profileUser)
  useEffect(() => {
    if (!initState.current) {
      useLoggedUserStore.setState({ credentialUser: user })
      console.log(user, 'user')
      //   profileUser(user?.id || '')
    }
    initState.current = true
  }, [])
  return <></>
}
