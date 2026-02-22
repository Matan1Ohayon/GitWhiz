import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamMessage, RateLimitError } from '../services/api'

const MAX_QUESTION_LENGTH = 1000

export default function Chat({ repoName }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hey! I've read the entire codebase. Ask me anything 🚀" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function buildHistory() {
    return messages
      .filter(m => m.role === 'user' || (m.role === 'bot' && !m.isGreeting))
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const question = input.trim()
    if (question.length > MAX_QUESTION_LENGTH) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    const history = buildHistory()
    let fullText = ''

    try {
      setMessages(prev => [...prev, { role: 'bot', text: '', sources: [] }])
      setLoading(false)

      await streamMessage(repoName, question, history, {
        onChunk(chunk) {
          fullText += chunk
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText }
            return updated
          })
        },
        onSources(sources) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
            return updated
          })
        },
        onError(message) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: message }
            return updated
          })
        }
      })
    } catch (e) {
      const errorMsg = e instanceof RateLimitError
        ? "You've hit the daily message limit (50/day). Come back tomorrow! 🐱"
        : 'Something went wrong, try again.'

      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'bot' && last.text === '') {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'bot', text: errorMsg }
          return updated
        }
        return [...prev, { role: 'bot', text: errorMsg }]
      })
      setLoading(false)
    }
  }

  const charsLeft = MAX_QUESTION_LENGTH - input.length

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-cyan-dark to-rose-dark flex-shrink-0">
        <img className='h-8 sm:h-10' src="/gitwhiz_logo.png" alt="GitWhiz Cat Logo" />
        <div>
          <div className="font-syne font-bold text-xs sm:text-sm text-white">WhizBot</div>
          <div className="text-[10px] sm:text-xs text-white/60">Knows this codebase inside out</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 overflow-y-auto min-h-0 max-h-[50vh] lg:max-h-[calc(100vh-300px)]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-1.5 sm:gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-[#141d2e] flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
              {msg.role === 'bot' ? '🐱' : '🧑'}
            </div>
            <div className="flex flex-col gap-1.5 max-w-[90%] sm:max-w-[85%]">
              <div className={`text-xs sm:text-sm leading-relaxed px-3 sm:px-4 py-2 sm:py-3 rounded-2xl overflow-hidden break-words ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-dark to-rose-dark text-white rounded-tr-sm'
                  : 'bg-gray-50 border border-gray-200 text-[#0f1f36]/80 dark:bg-[#141d2e] dark:border-white/10 dark:text-white/80 rounded-tl-sm'
              }`}>
                {msg.role === 'bot' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert overflow-hidden break-words
                    prose-p:my-1 prose-p:leading-relaxed
                    prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-cyan-dark prose-code:text-xs prose-code:break-all dark:prose-code:bg-white/10 dark:prose-code:text-cyan-light
                    prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:overflow-x-auto dark:prose-pre:bg-white/5 dark:prose-pre:border-white/10
                    prose-strong:text-[#0f1f36] prose-strong:font-semibold dark:prose-strong:text-white
                    prose-ul:my-1 prose-li:my-0.5
                    prose-headings:text-[#0f1f36] prose-headings:font-syne dark:prose-headings:text-white
                    prose-table:my-2 prose-table:text-left prose-table:w-full
                    prose-th:border prose-th:border-gray-200 dark:prose-th:border-white/20 prose-th:bg-gray-100 dark:prose-th:bg-white/10 prose-th:px-2 prose-th:py-1.5 prose-th:font-semibold
                    prose-td:border prose-td:border-gray-200 dark:prose-td:border-white/20 prose-td:px-2 prose-td:py-1.5">
                    <div className="overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ) : msg.text}
              </div>
              {msg.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1">
                  {msg.sources.map(src => (
                    <span key={src} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 text-cyan-dark dark:text-cyan-light border border-cyan/20 truncate max-w-[180px]">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 sm:gap-2 items-end">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-[#141d2e] flex items-center justify-center text-xs sm:text-sm">🐱</div>
            <div className="bg-gray-50 border border-gray-200 dark:bg-[#141d2e] dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="flex flex-col gap-1 p-3 sm:p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the codebase..."
            className="flex-1 bg-gray-50 border border-gray-200 dark:bg-[#141d2e] dark:border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[#0f1f36] dark:text-white placeholder-gray-400 dark:placeholder-white/20 outline-none focus:border-cyan transition-all"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-cyan-dark to-rose flex items-center justify-center text-white hover:scale-105 transition-all flex-shrink-0 text-sm disabled:opacity-40 disabled:hover:scale-100"
          >
            ➤
          </button>
        </div>
        {input.length > 0 && (
          <span className={`text-[10px] text-right ${charsLeft < 100 ? 'text-rose' : 'text-gray-400 dark:text-white/20'}`}>
            {charsLeft} characters left
          </span>
        )}
      </div>
    </div>
  )
}
