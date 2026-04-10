import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRole(userId) {
  const [isExecutor, setIsExecutor] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    supabase
      .from('executors')
      .select('id', { count: 'exact', head: true })
      .eq('executor_user_id', userId)
      .then(({ count }) => {
        setIsExecutor(count > 0)
        setLoading(false)
      })
  }, [userId])

  return { isExecutor, loading }
}
