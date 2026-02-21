const BASE_URL = 'http://127.0.0.1:8080/api'

export async function ingestRepo(url) {
  const res = await fetch(`${BASE_URL}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  if (!res.ok) throw new Error('Failed to ingest repo')
  return res.json()
}

export async function sendMessage(repoName, question) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_name: repoName, question })
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}