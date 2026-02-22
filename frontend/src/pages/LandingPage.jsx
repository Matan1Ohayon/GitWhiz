import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ingestRepo, RateLimitError } from '../services/api'
import { Link2, Brain } from 'lucide-react'

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[\w.\-]+\/[\w.\-]+\/?$/

const loadingMsgs = [
  "Reading files so you don't have to...",
  "Chunking code into bite-sized pieces...",
  "Building your personal code whisperer...",
  "Asking Claude to be your tech lead...",
  "Almost there, indexing the last bits..."
]

export default function LandingPage({ setRepoData }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleWhiz() {
    if (!url) return

    if (!GITHUB_URL_REGEX.test(url.trim())) {
      setError('Invalid URL. Please paste a valid GitHub repo link (e.g. https://github.com/owner/repo)')
      return
    }

    setLoading(true)
    setError('')

    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % loadingMsgs.length)
    }, 900)

    try {
      const data = await ingestRepo(url)
      setRepoData(data)
      navigate('/dashboard')
    } catch (e) {
      if (e instanceof RateLimitError) {
        setError('Daily limit reached — you can analyze up to 5 repos per day. Come back tomorrow!')
      } else {
        setError(e.message || 'Something went wrong. Check the URL and try again.')
      }
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/95 dark:bg-[#090d14]/95">
      <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-cyan border-r-rose animate-spin" />
      <p className="font-syne font-semibold text-[#0f1f36]/50 dark:text-white/50 text-base">{loadingMsgs[msgIndex]}</p>
    </div>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 sm:px-6 text-center py-4 md:py-6">
      {/* EYEBROW */}
      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium tracking-widest uppercase text-cyan border border-cyan/20 bg-cyan/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 lg:mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
        Understand any repo in seconds
      </div>

      {/* HEADLINE */}
      <h1 className="font-syne font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none tracking-tighter mb-3 sm:mb-4 lg:mb-5">
        Stop reading.<br />
        <span className="bg-gradient-to-r from-cyan to-rose bg-clip-text text-transparent">
          Start Whizzing.
        </span>
      </h1>

      <p className="text-[#0f1f36]/40 dark:text-white/40 font-light text-sm sm:text-lg max-w-md leading-relaxed mb-4 sm:mb-6 lg:mb-8">
        Paste a GitHub URL. Get an instant explanation, architecture breakdown,
        and an AI chatbot that knows the codebase inside out.
      </p>

      {/* INPUT */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full max-w-xl bg-white border border-gray-200 dark:bg-[#0f1724] dark:border-white/10 rounded-2xl px-3 sm:px-5 py-2 gap-2 sm:gap-3 mb-3 lg:mb-4 focus-within:border-cyan transition-all">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <span className="text-lg"><Link2/></span>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleWhiz()}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-[#0f1f36] dark:text-white placeholder-gray-400 dark:placeholder-white/20 font-sans"
          />
        </div>
        <button
          onClick={handleWhiz}
          className="bg-gradient-to-r flex-row flex items-center justify-center from-cyan-dark to-rose text-white font-syne font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan/30 transition-all"
        >
          Whiz it
          <Brain className='h-4 pl-2' />
        </button>
      </div>

      {error && <p className="text-rose text-xs sm:text-sm mb-3">{error}</p>}

      {/* STATS */}
      <div className="flex gap-6 sm:gap-10 mt-2 lg:mt-4 flex-shrink-0">
        {[['2.3s', 'avg analysis time'], ['∞', 'repo size support'], ['RAG', 'powered search']].map(([num, label]) => (
          <div key={label} className="text-center">
            <div className="font-syne font-extrabold text-2xl sm:text-3xl bg-gradient-to-r from-cyan to-rose bg-clip-text text-transparent">{num}</div>
            <div className="text-[10px] sm:text-xs text-[#0f1f36]/30 dark:text-white/30 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
