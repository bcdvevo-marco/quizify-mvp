'use client'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; kind: ToastKind }
interface ToastCtx { show: (message: string, kind?: ToastKind) => void }

const Ctx = createContext<ToastCtx>({ show: () => {} })

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const COLORS: Record<ToastKind, string> = {
  success: '#10b981',
  error: '#ef4444',
  info: '#6366f1',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, kind }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(15,12,41,0.95)',
              border: `1px solid ${COLORS[t.kind]}40`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              maxWidth: 320,
              animation: 'toast-in 0.25s ease',
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: COLORS[t.kind],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {ICONS[t.kind]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
