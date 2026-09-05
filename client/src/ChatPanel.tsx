import { useState } from 'react'
import type { FormEvent } from 'react'
import './ChatPanel.css'

const suggestions = [
  'Bu dokümanın ana konusu nedir?',
  'Önemli bilgileri maddeler hâlinde özetle.',
  'Dokümanda kaynak gösterme hakkında ne yazıyor?',
]

function ChatPanel() {
  const [question, setQuestion] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <div>
          <p className="eyebrow">ASKDOCS AI</p>
          <h2>Dokümanlarına soru sor</h2>

          <p>
            AskDocs yalnızca yüklediğin dokümanları kullanarak
            cevap verecek ve kullandığı kaynakları gösterecek.
          </p>
        </div>

        <span className="ai-waiting-badge">
          MiniMax API bekleniyor
        </span>
      </div>

      <div className="chat-content">
        <div className="chat-empty-state">
          <div className="chat-logo">A</div>

          <h3>Kaynaklı yanıt almaya hazır ol</h3>

          <p>
            MiniMax bağlantısı tamamlandığında sorun burada
            yanıtlanacak. Her cevabın altında belge adı ve sayfa
            numarası gösterilecek.
          </p>

          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => {
                  setQuestion(suggestion)
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <aside className="source-preview">
          <p className="source-preview-title">
            CEVAP AKIŞI
          </p>

          <div className="source-step">
            <span>1</span>
            <div>
              <strong>Soru analiz edilir</strong>
              <p>Sorunun embedding’i oluşturulur.</p>
            </div>
          </div>

          <div className="source-step">
            <span>2</span>
            <div>
              <strong>Kaynaklar bulunur</strong>
              <p>En alakalı doküman parçaları seçilir.</p>
            </div>
          </div>

          <div className="source-step">
            <span>3</span>
            <div>
              <strong>Yanıt oluşturulur</strong>
              <p>Cevap, belge ve sayfa bilgisiyle sunulur.</p>
            </div>
          </div>
        </aside>
      </div>

      <form className="question-form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
          }}
          maxLength={1000}
          rows={3}
          placeholder="Dokümanlar hakkında bir soru yaz..."
        />

        <div className="question-form-footer">
          <span>{question.length} / 1000</span>

          <button type="submit" disabled>
            API bekleniyor
          </button>
        </div>
      </form>
    </section>
  )
}

export default ChatPanel