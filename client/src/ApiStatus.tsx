import { useEffect, useState } from 'react'
import './ApiStatus.css'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001'

type ConnectionStatus =
  | 'checking'
  | 'connected'
  | 'disconnected'

function ApiStatus() {
  const [status, setStatus] =
    useState<ConnectionStatus>('checking')

  useEffect(() => {
    let active = true

    async function checkApi() {
      try {
        const response = await fetch(`${API_URL}/api/health`)

        if (!response.ok) {
          throw new Error('API yanıt vermedi.')
        }

        const data = (await response.json()) as {
          status?: string
        }

        if (active) {
          setStatus(
            data.status === 'ok'
              ? 'connected'
              : 'disconnected'
          )
        }
      } catch {
        if (active) {
          setStatus('disconnected')
        }
      }
    }

    void checkApi()

    const intervalId = window.setInterval(() => {
      void checkApi()
    }, 15000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const label =
    status === 'checking'
      ? 'Kontrol ediliyor'
      : status === 'connected'
        ? 'API bağlı'
        : 'API bağlantısı yok'

  return (
    <div
      className={`api-status api-status-${status}`}
      aria-live="polite"
      title="Backend bağlantı durumu"
    >
      <span className="status-dot" />
      {label}
    </div>
  )
}

export default ApiStatus