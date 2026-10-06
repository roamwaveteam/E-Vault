import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

const ONBOARDING_KEY = 'exam-vault-onboarding-complete'
const defaultSetup = { family: 'all', subject: 'all', department: 'all', year: 'all', paperNumber: '' }

function App() {
  const [papers, setPapers] = useState([])
  const [families, setFamilies] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState(defaultSetup)
  const [query, setQuery] = useState('')
  const [onboarding, setOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true')
  const [tutorialStep, setTutorialStep] = useState(1)
  const [setup, setSetup] = useState(defaultSetup)
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

      const [familyResult, departmentResult, paperResult] = await Promise.all([
        supabase.from('exam_families').select('id, code, name').order('name'),
        supabase.from('departments').select('id, exam_family_id, code, name, stream').order('name'),
        supabase.from('downloadable_papers').select('id, exam_family_id, department_id, year, session, subject, paper_number, title, file_url, availability').order('year', { ascending: false }).order('subject'),
      ])

      if (!active) return
      if (familyResult.error || departmentResult.error || paperResult.error) {
        setError(familyResult.error?.message || departmentResult.error?.message || paperResult.error?.message || 'Could not load the paper library.')
        setLoading(false)
        return
      }

      setFamilies(familyResult.data || [])
      setDepartments(departmentResult.data || [])
      setPapers(paperResult.data || [])
      setLoading(false)
    }

    loadLibrary()
    return () => { active = false }
  }, [])

  const familyMap = useMemo(() => new Map(families.map((item) => [item.id, item])), [families])
  const departmentMap = useMemo(() => new Map(departments.map((item) => [item.id, item])), [departments])
  const availableDepartments = useMemo(() => {
    if (filters.family === 'all') return departments
    return departments.filter((item) => item.exam_family_id === filters.family)
  }, [departments, filters.family])
  const availableSetupDepartments = useMemo(() => {
    if (setup.family === 'all') return departments
    return departments.filter((item) => item.exam_family_id === setup.family)
  }, [departments, setup.family])
  const subjects = useMemo(() => [...new Set(papers.map((paper) => paper.subject).filter(Boolean))].sort(), [papers])
  const years = useMemo(() => [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a), [papers])
  const paperNumbers = useMemo(() => [...new Set(papers.map((paper) => paper.paper_number).filter(Boolean))].sort(), [papers])

  const filteredPapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return papers.filter((paper) => {
      const examName = familyMap.get(paper.exam_family_id)?.name || ''
      const departmentName = departmentMap.get(paper.department_id)?.name || ''
      const searchable = `${paper.title} ${paper.subject} ${examName} ${departmentName} ${paper.year} ${paper.paper_number}`.toLowerCase()
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (filters.family === 'all' || paper.exam_family_id === filters.family)
        && (filters.subject === 'all' || paper.subject === filters.subject)
        && (filters.department === 'all' || paper.department_id === filters.department)
        && (filters.year === 'all' || String(paper.year) === filters.year)
        && (!filters.paperNumber || (paper.paper_number || '').toLowerCase().includes(filters.paperNumber.toLowerCase()))
    })
  }, [departmentMap, familyMap, filters, papers, query])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'family' ? { department: 'all' } : {}) }))
  }

  function updateSetup(name, value) {
    setSetup((current) => ({ ...current, [name]: value, ...(name === 'family' ? { department: 'all' } : {}) }))
  }

  function finishOnboarding() {
    setFilters(setup)
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOnboarding(false)
  }

  function skipOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOnboarding(false)
  }

  function resetFilters() {
    setFilters(defaultSetup)
    setQuery('')
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => key === 'paperNumber' ? value : value !== 'all').length

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="Exam Vault home"><span className="brand-mark">E</span><span className="brand-name">Exam Vault</span></a>
        <div className="topbar-links"><a href="#library">Library</a><a href="#how-it-works">How it works</a><span className="status-pill"><i /> Live archive</span></div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Cameroon’s examination archive</p>
          <h1>Your next paper<br /><em>starts here.</em></h1>
          <p className="hero-copy">A considered, distraction-free way to find the past examination papers you need — organised by exam, subject, department and year.</p>
          <button className="primary-button hero-button" onClick={() => setOnboarding(true)}>Find a paper <span>→</span></button>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><span>PDF</span><small>READ ONLY</small></div></div>
      </section>

      <section className="quick-find" id="library">
        <div className="section-heading"><div><p className="eyebrow">Quick find</p><h2>What are you studying?</h2></div><span className="result-count"><strong>{filteredPapers.length}</strong> papers</span></div>
        <div className="finder-grid">
          <label className="field field-wide"><span>Search anything</span><div className="input-shell"><b>⌕</b><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Mathematics 2020”" /></div></label>
          <label className="field"><span>Exam type</span><select value={filters.family} onChange={(event) => updateFilter('family', event.target.value)}><option value="all">All exams</option>{families.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Subject</span><select value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)}><option value="all">All subjects</option>{subjects.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Department</span><select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}><option value="all">All departments</option>{availableDepartments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Year</span><select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}><option value="all">All years</option>{years.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Paper number</span><input value={filters.paperNumber} onChange={(event) => updateFilter('paperNumber', event.target.value)} placeholder="e.g. Paper 1" list="paper-numbers" /></label>
          <datalist id="paper-numbers">{paperNumbers.map((item) => <option value={item} key={item} />)}</datalist>
        </div>
        <div className="active-search-row"><span>{activeFilterCount ? `${activeFilterCount} filters active` : 'Browse the complete archive'}</span>{activeFilterCount > 0 && <button onClick={resetFilters}>Clear filters</button>}</div>
      </section>

      <section className="results-section">
        {loading && <div className="empty-state"><div className="spinner" /><p>Preparing your library...</p></div>}
        {!loading && error && <div className="empty-state error-state"><strong>Library unavailable</strong><p>{error}</p></div>}
        {!loading && !error && filteredPapers.length === 0 && <div className="empty-state"><span className="empty-icon">⌁</span><strong>No paper found yet.</strong><p>Try widening your choices or search for another subject, year or paper number.</p></div>}
        {!loading && !error && filteredPapers.length > 0 && <div className="paper-grid">{filteredPapers.map((paper) => {
          const examName = familyMap.get(paper.exam_family_id)?.name || 'Exam paper'
          const departmentName = departmentMap.get(paper.department_id)?.name
          return <article className="paper-card" key={paper.id}><div className="card-topline"><span className="pdf-badge">PDF</span><span>{paper.year}</span></div><h3>{paper.title}</h3><p className="paper-meta">{examName}{departmentName ? ` · ${departmentName}` : ''}</p><p className="paper-session">{paper.subject}{paper.paper_number ? ` · ${paper.paper_number}` : ''}</p><div className="card-actions"><button className="view-button" onClick={() => setSelectedPaper(paper)}>Read paper</button><a className="download-link" href={paper.file_url} download target="_blank" rel="noreferrer">Download <span>↗</span></a></div></article>
        })}</div>}
      </section>

      <section className="feature-strip" id="how-it-works"><div><span className="feature-number">01</span><h2>Choose your path.</h2><p>Tell us the exam, subject, department, year and paper number. Exam Vault remembers your setup.</p></div><div><span className="feature-number">02</span><h2>Find it instantly.</h2><p>Every result is a source-linked PDF, ready to read in a clean, read-only viewer.</p></div><div><span className="feature-number">03</span><h2>Study with clarity.</h2><p>No clutter. No editing tools. Just the paper you came for.</p></div></section>
      <footer className="footer"><span>Exam Vault</span><span>Cameroon · Read-only PDF archive</span></footer>

      {selectedPaper && <div className="viewer-backdrop" role="presentation" onClick={() => setSelectedPaper(null)}><section className="viewer" role="dialog" aria-modal="true" aria-label={selectedPaper.title} onClick={(event) => event.stopPropagation()}><header className="viewer-header"><div><span className="pdf-badge">PDF</span><h2>{selectedPaper.title}</h2></div><div className="viewer-actions"><a className="download-link" href={selectedPaper.file_url} download target="_blank" rel="noreferrer">Download PDF</a><button className="close-button" onClick={() => setSelectedPaper(null)} aria-label="Close viewer">×</button></div></header><div className="viewer-frame"><iframe title={`${selectedPaper.title} read-only viewer`} src={selectedPaper.file_url} /></div><p className="viewer-note">Read-only viewer. Exam Vault does not modify the source PDF.</p></section></div>}

      {onboarding && <div className="onboarding-backdrop"><section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><div className="onboarding-top"><span className="brand-mark small">E</span><button onClick={skipOnboarding} aria-label="Skip setup">Skip for now</button></div><div className="progress-dots"><i className={tutorialStep === 1 ? 'active' : ''} /><i className={tutorialStep === 2 ? 'active' : ''} /></div>{tutorialStep === 1 ? <div className="onboarding-content"><p className="eyebrow">Welcome to Exam Vault</p><h2 id="welcome-title">Let’s make finding<br /><em>your paper</em> effortless.</h2><p>Set your study preferences once. We’ll take you straight to the most relevant papers every time you open the library.</p><div className="onboarding-illustration"><span>01</span><strong>Exam type</strong><small>GCE · HND · BTS · more</small></div><button className="primary-button full-button" onClick={() => setTutorialStep(2)}>Set up my library <span>→</span></button></div> : <div className="onboarding-content"><p className="eyebrow">Personalise your search</p><h2 id="welcome-title">What paper<br /><em>are you looking for?</em></h2><div className="onboarding-fields"><label className="field"><span>Exam type</span><select value={setup.family} onChange={(event) => updateSetup('family', event.target.value)}><option value="all">Choose an exam</option>{families.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Subject</span><select value={setup.subject} onChange={(event) => updateSetup('subject', event.target.value)}><option value="all">Choose a subject</option>{subjects.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label className="field"><span>Department</span><select value={setup.department} onChange={(event) => updateSetup('department', event.target.value)}><option value="all">Choose a department</option>{availableSetupDepartments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Year</span><select value={setup.year} onChange={(event) => updateSetup('year', event.target.value)}><option value="all">Choose a year</option>{years.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label className="field field-wide"><span>Paper number <small>optional</small></span><input value={setup.paperNumber} onChange={(event) => updateSetup('paperNumber', event.target.value)} placeholder="e.g. Paper 1 or 02" list="paper-numbers" /></label></div><button className="primary-button full-button" onClick={finishOnboarding}>Show my papers <span>→</span></button><button className="text-button" onClick={() => setTutorialStep(1)}>Back</button></div>}</section></div>}
    </main>
  )
}

export default App
