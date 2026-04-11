'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useProfileGuard() {
  const router = useRouter()
  useEffect(() => {
    try {
      if (!localStorage.getItem('gtl-active-profile')) {
        router.replace('/fitness')
      }
    } catch (_) {}
  }, [])
}
