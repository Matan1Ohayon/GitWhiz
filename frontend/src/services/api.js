const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api'

class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
  }
}

async function handleResponse(res) {
  if (res.status === 429) throw new RateLimitError()
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Something went wrong')
  }
  return res.json()
}

export async function ingestRepo(url) {
  const res = await fetch(`${BASE_URL}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  return handleResponse(res)
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