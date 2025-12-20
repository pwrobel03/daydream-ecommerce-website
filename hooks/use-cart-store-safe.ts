// hooks/use-cart-store-safe.ts
import { useState, useEffect } from 'react'
import useCartStore from '@/store' // Twoja ścieżka do store

export const useCartStoreSafe = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F
) => {
  const result = store(callback) as F
  const [data, setData] = useState<F>()

  useEffect(() => {
    setData(result)
  }, [result])

  return data
}