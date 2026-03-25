'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem('user')
    if (user) router.push('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(username, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{background:'#0f0f0f'}}>
      <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'20px',padding:'32px 24px',width:'100%',maxWidth:'360px'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'48px',height:'48px',background:'#1f3a2a',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'22px'}}>🏠</div>
          <h1 style={{color:'#fff',fontSize:'20px',fontWeight:500,margin:'0 0 4px'}}>Familia Mendoza</h1>
          <p style={{color:'#555',fontSize:'13px',margin:0}}>Gestión del hogar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'8px'}}>
            <label style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px'}}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{width:'100%',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#fff',outline:'none',boxSizing:'border-box'}}
              placeholder="tunombre"
              autoComplete="off"
              required
            />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px'}}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{width:'100%',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#fff',outline:'none',boxSizing:'border-box'}}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p style={{color:'#f87171',background:'#2a0e0e',borderRadius:'8px',padding:'10px 12px',fontSize:'13px',marginBottom:'12px'}}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{width:'100%',background: loading ? '#1a1a1a' : '#166534',border: loading ? '0.5px solid #2e2e2e' : 'none',borderRadius:'10px',padding:'12px',color:'#4ade80',fontSize:'14px',fontWeight:500,cursor: loading ? 'not-allowed' : 'pointer',opacity: loading ? 0.6 : 1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
