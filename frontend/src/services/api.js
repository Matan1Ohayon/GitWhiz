// In dev, use proxy (no CORS). In prod, use VITE_API_URL.
const BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api').replace(/\/$/, '')

class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
  }
}

async function handleResponse(res) {
  if (res.status === 429) throw new RateLimitError()
  if (!res.ok) {
    const text = await res.text()
    let detail = ''
    try {
      const body = JSON.parse(text)
      detail = body.detail || body.message || ''
    } catch {
      if (res.status === 503 || text.includes('almost ready') || text.includes('Bad Gateway'))
        detail = 'The backend is starting up (cold start). Wait a few seconds and try again.'
      else if (res.status === 502) detail = 'Backend is unavailable (502). Try again later.'
      else if (res.status === 404) detail = 'API endpoint not found. Check VITE_API_URL.'
      else if (res.status === 0) detail = 'Connection failed. Check CORS or network.'
      else detail = `Request failed (${res.status}).`
    }
    const msg = detail || `Request failed (${res.status}). Something went wrong.`
    console.error('[API Error]', res.status, res.url, msg, text?.slice(0, 200))
    throw new Error(msg)
  }
  return res.json()
}

export async function ingestRepo(url) {
  try {
    const res = await fetch(`${BASE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    return handleResponse(res)
  } catch (e) {
    if (e instanceof RateLimitError) throw e
    const msg = e.message || ''
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed'))
      throw new Error('Cannot reach the API. Check VITE_API_URL, CORS, or that the backend is running.')
    throw e
  }
}

export async function streamMessage(repoName, question, history, { onChunk, onSources, onError }) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_name: repoName, question, history })
  })

  if (res.status === 429) throw new RateLimitError()
  if (!res.ok) throw new Error('Failed to send message')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'chunk') onChunk(parsed.content)
        else if (parsed.type === 'sources') onSources(parsed.sources)
        else if (parsed.type === 'error') onError(parsed.message)
      } catch { /* skip malformed SSE lines */ }
    }
  }
}

export { RateLimitError }