import { useEffect, useState } from 'react'
import './DocumentDetails.css'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001'

type DocumentRecord = {
  id: string
  filename: string
  file_type: string
  file_size: string | number
  chunk_count: number
  created_at: string
}

type DocumentChunk = {
  id: string
  chunk_index: number
  content: string
  source_page: number | null
  created_at: string
}

type DocumentDetailsResponse = {
  document: DocumentRecord
  chunks: DocumentChunk[]
  message?: string
}

type DocumentDetailsProps = {
  documentId: string
  onClose: () => void
}

function DocumentDetails({
  documentId,
  onClose,
}: DocumentDetailsProps) {
  const [document, setDocument] =
    useState<DocumentRecord | null>(null)
  const [chunks, setChunks] = useState<DocumentChunk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDetails() {
      try {
        const response = await fetch(
          `${API_URL}/api/documents/${documentId}`
        )

        const data =
          (await response.json()) as DocumentDetailsResponse

        if (!response.ok) {
          throw new Error(
            data.message ?? 'Doküman detayları alınamadı.'
          )
        }

        if (!cancelled) {
          setDocument(data.document)
          setChunks(data.chunks)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Doküman detayları alınamadı.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [documentId])

  return (
    <div
      className="details-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        onMouseDown={(event) => {
          event.stopPropagation()
        }}
      >
        <header className="details-header">
          <div>
            <p className="details-eyebrow">DOKÜMAN DETAYLARI</p>
            <h2 id="details-title">
              {document?.filename ?? 'Doküman yükleniyor'}
            </h2>
          </div>

          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="Detay penceresini kapat"
          >
            ×
          </button>
        </header>

        {isLoading ? (
          <div className="details-state">
            <div className="details-spinner" />
            <p>Doküman parçaları yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="details-error">{error}</div>
        ) : (
          <>
            <div className="details-summary">
              <span>
                <strong>{document?.file_type.toUpperCase()}</strong>
                Dosya türü
              </span>

              <span>
                <strong>{document?.chunk_count}</strong>
                Toplam parça
              </span>
            </div>

            <div className="chunks-list">
              {chunks.map((chunk) => (
                <article className="chunk-card" key={chunk.id}>
                  <div className="chunk-heading">
                    <strong>Parça {chunk.chunk_index}</strong>

                    <span>
                      {chunk.source_page
                        ? `Sayfa ${chunk.source_page}`
                        : 'Sayfa bilgisi yok'}
                    </span>
                  </div>

                  <p>{chunk.content}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default DocumentDetails