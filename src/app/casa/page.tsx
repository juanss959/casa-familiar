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
    if (esPropio) return <span style={{background:'#222',color:'#555',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Nuestro</span>
    const e = estados[piso]
    if (e === 'vencido') return <span style={{background:'#2a0e0e',color:'#f87171',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Vencido</span>
    if (e === 'por_vencer') return <span style={{background:'#2a2200',color:'#facc15',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Vence mañana</span>
    if (e === 'tarde') return <span style={{background:'#2a0e0e',color:'#f87171',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Pagó tarde</span>
    return <span style={{background:'#1f3a2a',color:'#4ade80',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Al día</span>
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{background:'#0f0f0f'}}>
      <p style={{color:'#555',fontSize:'14px'}}>Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-4" style={{background:'#0f0f0f'}}>
      <div className="max-w-sm mx-auto">
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px',marginTop:'16px'}}>
          <button onClick={() => router.push('/dashboard')} style={{color:'#555',fontSize:'13px',background:'none',border:'none',cursor:'pointer',padding:0}}>← Inicio</button>
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
              <div key={piso} style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'16px',padding:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <span style={{color:'#fff',fontSize:'14px',fontWeight:500}}>Piso {piso}</span>
                  {getBadge(piso, esPropio)}
                </div>
                {aptosDelPiso.filter(a => !a.es_propio).map(apto => (
                  <Link key={apto.id} href={`/casa/apto/${apto.id}`}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 8px',borderTop:'0.5px solid #222',cursor:'pointer'}}>
                      <span style={{color:'#aaa',fontSize:'13px'}}>{apto.nombre}</span>
                      <span style={{color:'#4ade80',fontSize:'12px'}}>Ver →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
