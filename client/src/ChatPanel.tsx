import { useState } from 'react'
import type { FormEvent } from 'react'
import './ChatPanel.css'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001'

const suggestions = [
  'Bu dokümanın ana konusu nedir?',
  'Önemli bilgileri maddeler hâlinde özetle.',
  'Dokümanda kaynak gösterme hakkında ne yazıyor?',
]

type AnswerSource = {
  chunk_id: string
  filename: string
  source_page: number | null
}

type QuestionResponse = {
  answer?: string
  model?: string
  response_time_ms?: number
  token_count?: number
  sources?: AnswerSource[]
  message?: string
}

function ChatPanel() {
  const [question, setQuestion] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<AnswerSource[]>([])
  const [responseTime, setResponseTime] = useState<number | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const trimmedQuestion = question.trim()

    if (trimmedQuestion.length < 3) {
      setError('Soru en az 3 karakter olmalıdır.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        }
      )

      const data = (await response.json()) as QuestionResponse

      if (!response.ok) {
        throw new Error(
          data.message ?? 'Soru yanıtlanamadı.'
        )
      }

      if (!data.answer) {
        throw new Error('MiniMax boş cevap döndürdü.')
      }

      setLastQuestion(trimmedQuestion)
      setAnswer(data.answer)
      setSources(data.sources ?? [])
      setResponseTime(data.response_time_ms ?? null)
      setQuestion('')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Soru yanıtlanamadı.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <div>
          <p className="eyebrow">ASKDOCS AI</p>
          <h2>Dokümanlarına soru sor</h2>

          <p>
            AskDocs yalnızca yüklediğin dokümanları kullanarak
            cevap verir ve kullandığı kaynakları gösterir.
          </p>
        </div>

        <span className="ai-ready-badge">
          MiniMax M3 bağlı
        </span>
      </div>

      <div className="chat-content">
        {answer ? (
          <div
            className="chat-answer-state"
            aria-live="polite"
          >
            <div className="asked-question">
              <span>SORUN</span>
              <p>{lastQuestion}</p>
            </div>

            <div className="generated-answer">
              <div className="answer-heading">
                <div className="chat-logo">A</div>

                <div>
                  <span>ASKDOCS YANITI</span>
                  <strong>MiniMax M3</strong>
                </div>
              </div>

              <p className="answer-text">
                 {answer.replaceAll('**', '')}
                </p>

              {responseTime !== null && (
                <span className="answer-time">
                  Yanıt süresi:{' '}
                  {(responseTime / 1000).toFixed(1)} saniye
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-empty-state">
            <div className="chat-logo">A</div>

            <h3>Kaynaklı yanıt almaya hazır</h3>

            <p>
              Sorunu yazdığında MiniMax M3 yalnızca yüklediğin
              dokümanları kullanarak cevap verecek. Her cevabın
              altında belge adı ve sayfa numarası gösterilecek.
            </p>

            <div className="suggestion-list">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => {
                    setQuestion(suggestion)
                    setError('')
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <aside className="source-preview">
          {sources.length > 0 ? (
            <>
              <p className="source-preview-title">
                KULLANILAN KAYNAKLAR
              </p>

              <div className="answer-source-list">
                {sources.map((source, index) => (
                  <div
                    className="answer-source"
                    key={source.chunk_id}
                  >
                    <span>{index + 1}</span>

                    <div>
                      <strong>{source.filename}</strong>
                      <p>
                        {source.source_page === null
                          ? 'Sayfa bilgisi yok'
                          : `Sayfa ${source.source_page}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="source-preview-title">
                CEVAP AKIŞI
              </p>

              <div className="source-step">
                <span>1</span>
                <div>
                  <strong>Soru analiz edilir</strong>
                  <p>Sorunun içeriği değerlendirilir.</p>
                </div>
              </div>

              <div className="source-step">
                <span>2</span>
                <div>
                  <strong>Kaynaklar bulunur</strong>
                  <p>
                    En alakalı doküman parçaları seçilir.
                  </p>
                </div>
              </div>

              <div className="source-step">
                <span>3</span>
                <div>
                  <strong>Yanıt oluşturulur</strong>
                  <p>
                    Cevap, belge ve sayfa bilgisiyle sunulur.
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}

      <form
        className="question-form"
        onSubmit={handleSubmit}
      >
        <textarea
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
            setError('')
          }}
          maxLength={1000}
          rows={3}
          disabled={isSubmitting}
          placeholder="Dokümanlar hakkında bir soru yaz..."
        />

        <div className="question-form-footer">
          <span>{question.length} / 1000</span>

          <button
            type="submit"
            disabled={
              isSubmitting || question.trim().length < 3
            }
          >
            {isSubmitting
              ? 'Yanıt hazırlanıyor...'
              : 'Soruyu gönder'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ChatPanel