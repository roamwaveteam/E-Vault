import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const isConnected = Boolean(supabase)
  return (
    <main className="shell">
      <nav className="nav"><span className="brand">E-Vault</span><span className="status"><i /> {isConnected ? 'Supabase configured' : 'Local setup'}</span></nav>
      <section className="hero">
        <p className="eyebrow">Student learning, kept simple</p>
        <h1>Your learning space is ready to build.</h1>
        <p className="lede">A clean starting point for lessons, notes, and progress. Connect the database when the first feature is ready.</p>
        <div className="actions"><a className="button primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase</a><a className="button secondary" href="https://vite.dev/guide/" target="_blank" rel="noreferrer">Read Vite docs</a></div>
      </section>
      <section className="cards" aria-label="Development status">
        <article><span className="number">01</span><h2>Frontend</h2><p>React and Vite are set up with linting and production builds.</p></article>
        <article><span className="number">02</span><h2>Backend</h2><p>Supabase client wiring is ready for authenticated app features.</p></article>
        <article><span className="number">03</span><h2>Next step</h2><p>Define the first user story before adding tables or migrations.</p></article>
      </section>
    </main>
  )
}

export default App
