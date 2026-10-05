import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

const fallbackPapers = []

function isPdfUrl(url = '') {
  return /\.pdf(?:$|[?#])/i.test(url)
}

function App() {
  const [papers, setPapers] = useState(fallbackPapers)
  const [families, setFamilies] = useState([])
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('all')
  const [year, setYear] = useState('all')
  const [subject, setSubject] = useState('all')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadLibrary() {
      if (!supabase) {
        setLoading(false)
        return
      }

      const [familyResult, paperResult] = await Promise.all([
        supabase.from('exam_families').select('id, code, name').order('name'),
        supabase
          .from('papers')
          .select('id, exam_family_id, year, session, subject, paper_number, title, file_url, availability')
          .eq('paper_type', 'question')
          .not('file_url', 'is', null)
          .order('year', { ascending: false })
          .order('subject'),
      ])

      if (!active) return
      if (familyResult.error || paperResult.error) {
        setError(familyResult.error?.message || paperResult.error?.message || 'Could not load the paper library.')
        setLoading(false)
        return
      }

      setFamilies(familyResult.data || [])
      setPapers((paperResult.data || []).filter((paper) => isPdfUrl(paper.file_url)))
      setLoading(false)
    }

    loadLibrary()
    return () => { active = false }
  }, [])

  const familyMap = useMemo(() => new Map(families.map((item) => [item.id, item])), [families])
  const years = useMemo(() => [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a), [papers])
  const subjects = useMemo(() => [...new Set(papers.map((paper) => paper.subject).filter(Boolean))].sort(), [papers])

  const filteredPapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return papers.filter((paper) => {
      const examName = familyMap.get(paper.exam_family_id)?.name || ''
      const searchable = `${paper.title} ${paper.subject} ${examName} ${paper.year}`.toLowerCase()
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (family === 'all' || paper.exam_family_id === family)
        && (year === 'all' || String(paper.year) === year)
        && (subject === 'all' || paper.subject === subject)
    })
  }, [family, familyMap, papers, query, subject, year])

  function resetFilters() {
    setQuery('')
    setFamily('all')
    setYear('all')
    setSubject('all')
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/">Exam Vault <span>/ Cameroon</span></a>
        <div className="topbar-note"><span className="live-dot" /> PDF library · read only</div>
      </nav>

      <section className="library-hero">
        <div>
          <p className="eyebrow">Past examination papers</p>
          <h1>Study from the source.</h1>
          <p className="hero-copy">Find Cameroon examination papers by exam, year, and subject. Every downloadable item is a PDF link and opens in a read-only viewer.</p>
        </div>
        <div className="hero-count"><strong>{filteredPapers.length}</strong><span>PDF papers<br />available</span></div>
      </section>

      <section className="library-panel" aria-label="Exam paper library">
        <div className="toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search papers, subjects, exams..." aria-label="Search papers" />
          </label>
          <select value={family} onChange={(event) => setFamily(event.target.value)} aria-label="Filter by exam">
            <option value="all">All exams</option>
            {families.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filter by year">
            <option value="all">All years</option>
            {years.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          <select value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Filter by subject">
            <option value="all">All subjects</option>
            {subjects.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          {(query || family !== 'all' || year !== 'all' || subject !== 'all') && <button className="reset-button" onClick={resetFilters}>Reset</button>}
        </div>

        {loading && <div className="empty-state"><div className="spinner" /><p>Loading the paper library...</p></div>}
        {!loading && error && <div className="empty-state error-state"><strong>Library unavailable</strong><p>{error}</p><small>Check your Supabase environment variables and public read policies.</small></div>}
        {!loading && !error && filteredPapers.length === 0 && <div className="empty-state"><span className="empty-icon">PDF</span><strong>No PDF papers match this search.</strong><p>Try another exam, year, or subject. Only records with a PDF URL are shown here.</p></div>}

        {!loading && !error && filteredPapers.length > 0 && (
          <div className="paper-grid">
            {filteredPapers.map((paper) => {
              const examName = familyMap.get(paper.exam_family_id)?.name || 'Exam paper'
              return (
                <article className="paper-card" key={paper.id}>
                  <div className="card-topline"><span className="pdf-badge">PDF</span><span>{paper.year}</span></div>
                  <h2>{paper.title}</h2>
                  <p className="paper-meta">{examName} · {paper.subject}</p>
                  <p className="paper-session">{paper.session || 'Main session'}{paper.paper_number ? ` · ${paper.paper_number}` : ''}</p>
                  <div className="card-actions">
                    <button className="view-button" onClick={() => setSelectedPaper(paper)}>Read paper</button>
                    <a className="download-link" href={paper.file_url} download target="_blank" rel="noreferrer">Download PDF <span>↗</span></a>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <footer className="footer"><span>Exam Vault</span><span>Read-only access · PDF sources preserved</span></footer>

      {selectedPaper && (
        <div className="viewer-backdrop" role="presentation" onClick={() => setSelectedPaper(null)}>
          <section className="viewer" role="dialog" aria-modal="true" aria-label={selectedPaper.title} onClick={(event) => event.stopPropagation()}>
            <header className="viewer-header">
              <div><span className="pdf-badge">PDF</span><h2>{selectedPaper.title}</h2></div>
              <div className="viewer-actions"><a className="download-link" href={selectedPaper.file_url} download target="_blank" rel="noreferrer">Download PDF</a><button className="close-button" onClick={() => setSelectedPaper(null)} aria-label="Close viewer">×</button></div>
            </header>
            <div className="viewer-frame"><iframe title={`${selectedPaper.title} read-only viewer`} src={selectedPaper.file_url} /></div>
            <p className="viewer-note">Read-only viewer. Exam Vault does not provide editing tools or modify the source PDF.</p>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
