import { useState } from 'react'
import './App.css'

function App() {
  // useState gives us a variable that React "remembers" between renders,
  // plus a function to update it. When you call the setter, React
  // automatically re-renders the UI with the new value.
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // This function runs when the user clicks "Scan".
  async function handleScan(e) {
    e.preventDefault() // stops the form from reloading the page
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Enter a URL first.')
      return
    }

    setLoading(true)
    try {
      // This calls OUR OWN backend function at /api/check
      // (the file we wrote at api/check.js). In development this runs
      // locally; once deployed to Vercel it runs as a serverless function.
      const res = await fetch(`/api/check?url=${encodeURIComponent(url)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Could not reach the scanner. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="prompt">root@scanner:~$</span>
        <h1>header-check</h1>
      </header>

      <p className="tagline">
        Paste any website URL. We check its live HTTP response for the
        security headers that matter.
      </p>

      <form className="scan-form" onSubmit={handleScan}>
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'scanning…' : 'scan'}
        </button>
      </form>

      {error && <p className="error">✕ {error}</p>}

      {result && (
        <section className="results">
          <div className="summary">
            <div className={`score score-${scoreTier(result.score)}`}>
              {result.score}%
            </div>
            <div className="summary-text">
              <p>{result.target}</p>
              <p className="muted">
                HTTPS: {result.usesHttps ? 'yes' : 'no'} · Status:{' '}
                {result.statusCode}
              </p>
            </div>
          </div>

          <ul className="header-list">
            {result.results.map((h) => (
              <li key={h.name} className={h.present ? 'ok' : 'missing'}>
                <span className="dot">{h.present ? '✓' : '✕'}</span>
                <div>
                  <p className="header-name">{h.name}</p>
                  <p className="header-why">{h.why}</p>
                  {h.value && <p className="header-value">{h.value}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// Small helper: turns a numeric score into a CSS class name
// so we can color it red/yellow/green.
function scoreTier(score) {
  if (score >= 80) return 'good'
  if (score >= 40) return 'mid'
  return 'bad'
}

export default App
