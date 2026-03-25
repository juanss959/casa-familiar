'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Apartamento = {
  id: string
  piso: number
  nombre: string
  es_propio: boolean
}

type EstadoPiso = {
  [key: number]: 'al_dia' | 'por_vencer' | 'vencido' | 'tarde'
}

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
)

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
)

export default function CasaPage() {
  const router = useRouter()
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([])
  const [estados, setEstados] = useState<EstadoPiso>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getUser()) { router.push('/'); return }
    cargarDatos()
  }, [router])

  async function cargarDatos() {
    const { data: aptos } = await supabase.from('apartamentos').select('*').order('piso')
    if (aptos) {
      setApartamentos(aptos)
      await calcularEstados(aptos)
    }
    setLoading(false)
  }

  async function calcularEstados(aptos: Apartamento[]) {
    const hoy = new Date()
    const manana = new Date(hoy)
    manana.setDate(hoy.getDate() + 1)
    const estadosPisos: EstadoPiso = {}

    for (const apto of aptos) {
      if (apto.es_propio) continue
      const { data: pagos } = await supabase
        .from('pagos').select('*')
        .eq('apartamento_id', apto.id)
        .eq('estado', 'pendiente')

      if (!pagos || pagos.length === 0) { estadosPisos[apto.piso] = 'al_dia'; continue }

      for (const pago of pagos) {
        const vence = new Date(pago.fecha_vencimiento)
        if (vence < hoy) estadosPisos[apto.piso] = 'vencido'
        else if (vence.toDateString() === manana.toDateString()) {
          if (estadosPisos[apto.piso] !== 'vencido') estadosPisos[apto.piso] = 'por_vencer'
        } else {
          if (!estadosPisos[apto.piso]) estadosPisos[apto.piso] = 'al_dia'
        }
      }
    }
    setEstados(estadosPisos)
  }

  const pisos = [1, 2, 3, 4]

  function getBadge(piso: number, esPropio: boolean) {
    if (esPropio) return <span style={{background:'#222',color:'#555',fontSize:'10px',padding:'3px 10px',borderRadius:'8px'}}>Nuestro</span>
    const e = estados[piso]
    if (e === 'vencido') return <span style={{background:'#2a0e0e',color:'#f87171',fontSize:'10px',padding:'3px 10px',borderRadius:'8px'}}>Vencido</span>
    if (e === 'por_vencer') return <span style={{background:'#2a2200',color:'#facc15',fontSize:'10px',padding:'3px 10px',borderRadius:'8px'}}>Vence mañana</span>
    if (e === 'tarde') return <span style={{background:'#2a0e0e',color:'#f87171',fontSize:'10px',padding:'3px 10px',borderRadius:'8px'}}>Pagó tarde</span>
    return <span style={{background:'#1f3a2a',color:'#4ade80',fontSize:'10px',padding:'3px 10px',borderRadius:'8px'}}>Al día</span>
  }

  function getDot(piso: number) {
    const e = estados[piso]
    if (e === 'vencido') return '#f87171'
    if (e === 'por_vencer') return '#facc15'
    return '#4ade80'
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{background:'#0f0f0f'}}>
      <p style={{color:'#555',fontSize:'14px'}}>Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-4" style={{background:'#0f0f0f'}}>
      <div className="max-w-sm mx-auto">
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',marginTop:'16px'}}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'8px 14px',color:'#888',fontSize:'12px',cursor:'pointer'}}
          >
            <ArrowLeft /> Inicio
          </button>
          <h1 style={{color:'#fff',fontSize:'20px',fontWeight:500,margin:0}}>Casa</h1>
        </div>

        <div style={{background:'#1a2a1a',border:'0.5px solid #2e3e2e',borderRadius:'12px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
          <span style={{fontSize:'14px'}}>📱</span>
          <p style={{color:'#4ade80',fontSize:'12px',margin:0}}>Alertas activas — 1 día antes del vencimiento</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {pisos.map(piso => {
            const aptosDelPiso = apartamentos.filter(a => a.piso === piso)
            const esPropio = aptosDelPiso.some(a => a.es_propio)
            return (
              <div key={piso} style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',overflow:'hidden'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px'}}>
                  <span style={{color:'#888',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Piso {piso}</span>
                  {getBadge(piso, esPropio)}
                </div>
                {aptosDelPiso.filter(a => !a.es_propio).map(apto => (
                  <div key={apto.id} style={{borderTop:'0.5px solid #222',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:getDot(apto.piso),flexShrink:0}}/>
                      <span style={{color:'#ccc',fontSize:'13px'}}>{apto.nombre}</span>
                    </div>
                    <Link href={`/casa/apto/${apto.id}`}>
                      <button style={{display:'inline-flex',alignItems:'center',gap:'5px',background:'#1a1a1a',border:'0.5px solid #2e5e3a',borderRadius:'10px',padding:'6px 12px',color:'#4ade80',fontSize:'12px',cursor:'pointer'}}>
                        Ver <ArrowRight />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
