import { useCallback, useEffect, useState } from 'react'
import './QueryHistory.css'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001'

type QueryRecord = {
  id: string
  question: string
  response: string | null
  response_time_ms: number | null
  token_count: number | null
  created_at: string
}

type QueriesResponse = {
  queries?: QueryRecord[]
  message?: string
}

type QueryHistoryProps = {
  refreshKey: number
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function QueryHistory({ refreshKey }: QueryHistoryProps) {
  const [queries, setQueries] = useState<QueryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQueries = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/queries`)
      const data = (await response.json()) as QueriesResponse

      if (!response.ok) {
        throw new Error(
          data.message ?? 'Sorgu geçmişi alınamadı.'
        )
      }

      setQueries(data.queries ?? [])
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Sorgu geçmişi alınamadı.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueries()
  }, [loadQueries, refreshKey])

  return (
    <section className="query-history">
      <div className="query-history-header">
        <div>
          <p className="eyebrow">GEÇMİŞ</p>
          <h2>Son sorular</h2>

          <p>
            MiniMax’e gönderilen son 20 soru ve cevapları.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadQueries()
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Yükleniyor...' : 'Yenile'}
        </button>
      </div>

      {error ? (
        <p className="query-history-error" role="alert">
          {error}
        </p>
      ) : isLoading ? (
        <div className="query-history-empty">
          Sorgular yükleniyor...
        </div>
      ) : queries.length === 0 ? (
        <div className="query-history-empty">
          Henüz soru sorulmadı.
        </div>
      ) : (
        <div className="query-history-list">
          {queries.map((query) => (
            <article
              className="query-history-item"
              key={query.id}
            >
              <div className="query-history-number">?</div>

              <div className="query-history-content">
                <strong>{query.question}</strong>

                <p>
                  {query.response
                    ? query.response.replaceAll('**', '')
                    : 'Bu sorgu için cevap kaydedilmedi.'}
                </p>

                <div className="query-history-meta">
                  <span>{formatDate(query.created_at)}</span>

                  {query.response_time_ms !== null && (
                    <span>
                      {(query.response_time_ms / 1000).toFixed(1)}
                      {' saniye'}
                    </span>
                  )}

                  {query.token_count !== null && (
                    <span>{query.token_count} token</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default QueryHistory