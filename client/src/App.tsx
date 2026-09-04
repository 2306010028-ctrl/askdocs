import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'

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

type DocumentsResponse = {
  documents: DocumentRecord[]
}

type MessageResponse = {
  message?: string
  document?: DocumentRecord
}

function formatFileSize(value: string | number) {
  const bytes = Number(value)

  if (!Number.isFinite(bytes)) {
    return '-'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDocuments() {
      try {
        const response = await fetch(`${API_URL}/api/documents`)
        const data = (await response.json()) as DocumentsResponse &
          MessageResponse

        if (!response.ok) {
          throw new Error(
            data.message ?? 'Dokümanlar alınamadı.'
          )
        }

        if (!cancelled) {
          setDocuments(data.documents)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Sunucuya bağlanılamadı.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [])

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null

    setSelectedFile(file)
    setMessage('')
    setError('')
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Lütfen PDF, DOCX veya TXT dosyası seçin.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setIsUploading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as MessageResponse

      if (!response.ok) {
        throw new Error(
          data.message ?? 'Dosya yüklenemedi.'
        )
      }

      if (data.document) {
        setDocuments((currentDocuments) => [
          data.document as DocumentRecord,
          ...currentDocuments,
        ])
      }

      setMessage(
        data.message ?? 'Dosya başarıyla yüklendi.'
      )
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Dosya yüklenemedi.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(document: DocumentRecord) {
    const confirmed = window.confirm(
      `"${document.filename}" isimli dokümanı silmek istediğinizden emin misiniz?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(document.id)
    setMessage('')
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${document.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = (await response.json()) as MessageResponse

      if (!response.ok) {
        throw new Error(
          data.message ?? 'Doküman silinemedi.'
        )
      }

      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (currentDocument) =>
            currentDocument.id !== document.id
        )
      )

      setMessage(
        data.message ?? 'Doküman başarıyla silindi.'
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Doküman silinemedi.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">A</div>

          <div>
            <strong>AskDocs</strong>
            <span>Doküman Asistanı</span>
          </div>
        </div>

        <div className="api-status">
          <span className="status-dot" />
          API bağlantısı
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">DOKÜMAN YÖNETİMİ</p>
          <h1>Bilgi kaynağını oluştur</h1>
          <p className="heading-description">
            Dokümanlarını yükle, metinlerini parçalara ayır ve
            soru-cevap sistemi için hazırla.
          </p>
        </div>

        <div className="summary-card">
          <strong>{documents.length}</strong>
          <span>Toplam doküman</span>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YENİ DOKÜMAN</p>
              <h2>Dosya yükle</h2>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <label className="drop-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />

              <span className="upload-icon">↑</span>

              {selectedFile ? (
                <>
                  <strong>{selectedFile.name}</strong>
                  <span>
                    {formatFileSize(selectedFile.size)}
                  </span>
                </>
              ) : (
                <>
                  <strong>Dosya seçmek için tıklayın</strong>
                  <span>PDF, DOCX veya TXT · En fazla 20 MB</span>
                </>
              )}
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={!selectedFile || isUploading}
            >
              {isUploading
                ? 'Doküman işleniyor...'
                : 'Dokümanı yükle'}
            </button>
          </form>

          <div className="process-info">
            <span>1</span>
            <p>
              <strong>Metin çıkarılır</strong>
              <small>Dosyanın içeriği okunur.</small>
            </p>
          </div>

          <div className="process-info">
            <span>2</span>
            <p>
              <strong>Parçalara ayrılır</strong>
              <small>İçerik aranabilir chunk’lara dönüşür.</small>
            </p>
          </div>

          <div className="process-info">
            <span>3</span>
            <p>
              <strong>Veritabanına kaydedilir</strong>
              <small>Kaynak ve sayfa bilgileri korunur.</small>
            </p>
          </div>
        </article>

        <article className="panel documents-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">KAYNAKLAR</p>
              <h2>Yüklenen dokümanlar</h2>
            </div>

            <span className="document-count">
              {documents.length} dosya
            </span>
          </div>

          <div className="notice-area" aria-live="polite">
            {message && (
              <p className="notice success-notice">{message}</p>
            )}

            {error && (
              <p className="notice error-notice">{error}</p>
            )}
          </div>

          {isLoading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Dokümanlar yükleniyor...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">□</span>
              <h3>Henüz doküman yok</h3>
              <p>
                İlk dokümanınızı soldaki alandan yükleyin.
              </p>
            </div>
          ) : (
            <div className="document-list">
              {documents.map((document) => (
                <div className="document-item" key={document.id}>
                  <div
                    className={`file-icon ${document.file_type}`}
                  >
                    {document.file_type.toUpperCase()}
                  </div>

                  <div className="document-details">
                    <strong title={document.filename}>
                      {document.filename}
                    </strong>

                    <span>
                      {formatFileSize(document.file_size)}
                      {' · '}
                      {document.chunk_count} parça
                      {' · '}
                      {formatDate(document.created_at)}
                    </span>
                  </div>

                  <button
                    className="delete-button"
                    type="button"
                    disabled={deletingId === document.id}
                    onClick={() => {
                      void handleDelete(document)
                    }}
                  >
                    {deletingId === document.id
                      ? 'Siliniyor...'
                      : 'Sil'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default App