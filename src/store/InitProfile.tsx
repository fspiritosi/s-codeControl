'use client'
import { profileUser } from '@/types/types'
import { useEffect, useRef } from 'react'
import { useLoggedUserStore } from './loggedUser'

export default function InitProfile({
  profile,
}: {
  profile: profileUser[] | undefined | any[]
}) {
  const initState = useRef(false)

  useEffect(() => {
    if (!initState.current) {
      useLoggedUserStore.setState({ profile: profile })
      console.log(profile, 'profile')
    }
    initState.current = true
  }, [])

  return <></>
}
