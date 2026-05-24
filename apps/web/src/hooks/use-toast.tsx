import { useState, useCallback } from 'react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastHandlers: ((toast: Toast) => void)[] = []

export function toast(opts: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastHandlers.forEach(h => h({ ...opts, id }))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
  }, [])

  useState(() => {
    toastHandlers.push(addToast)
    return () => { toastHandlers = toastHandlers.filter(h => h !== addToast) }
  })

  return { toasts, toast }
}
