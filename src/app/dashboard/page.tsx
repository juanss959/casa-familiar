'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Pago = {
  id: string
  apartamento_id: string
  fecha_vencimiento: string
  estado: string
}

type Apartamento = {
  id: string
  piso: number
  nombre: string
  es_propio: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getUser()) { router.push('/'); return }
    cargarDatos()
  }, [router])

  async function cargarDatos() {
    const { data: aptos } = await supabase.from('apartamentos').select('*').order('piso')
    const { data: pagosData } = await supabase.from('pagos').select('*').eq('estado', 'pendiente')
    if (aptos) setApartamentos(aptos)
    if (pagosData) setPagos(pagosData)
    setLoading(false)
  }

  function getEstadoApto(apto: Apartamento) {
    if (apto.es_propio) return null
    const hoy = new Date()
    const pago = pagos.find(p => p.apartamento_id === apto.id)
    if (!pago) return 'al_dia'
    const vence = new Date(pago.fecha_vencimiento)
    const diffDias = Math.floor((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDias < 0) return 'atrasado'
    if (diffDias === 0) return 'vence_hoy'
    if (diffDias === 1) return 'vence_manana'
    return 'al_dia'
  }

  function formatFecha(fechaStr: string) {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  const hoy = new Date()
  const diasSemana = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaHoy = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} ${meses[hoy.getMonth()]}`

  const aptosArriendados = apartamentos.filter(a => !a.es_propio)
  const alDia = aptosArriendados.filter(a => getEstadoApto(a) === 'al_dia').length
  const porVencer = aptosArriendados.filter(a => ['vence_hoy','vence_manana'].includes(getEstadoApto(a) ?? '')).length
  const atrasados = aptosArriendados.filter(a => getEstadoApto(a) === 'atrasado').length

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{background:'#0f0f0f'}}>
      <p style={{color:'#555',fontSize:'14px'}}>Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-4" style={{background:'#0f0f0f'}}>
      <div className="max-w-sm mx-auto">
        <div className="mb-6 mt-4">
          <p style={{color:'#555',fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',margin:'0 0 4px'}}>{fechaHoy}</p>
          <h1 style={{color:'#fff',fontSize:'22px',fontWeight:500,margin:'0 0 2px'}}>Bienvenido 👋</h1>
          <p style={{color:'#666',fontSize:'13px',margin:0}}>¿Qué quieres gestionar hoy?</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
          <Link href="/casa">
            <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'16px',padding:'20px 16px',cursor:'pointer'}}>
              <div style={{width:'36px',height:'36px',background:'#1f3a2a',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',fontSize:'16px'}}>🏠</div>
              <p style={{color:'#fff',fontSize:'14px',fontWeight:500,margin:'0 0 4px'}}>Casa</p>
              <p style={{color:'#555',fontSize:'11px',margin:0}}>4 pisos · 4 aptos</p>
            </div>
          </Link>
          <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'16px',padding:'20px 16px',opacity:0.45}}>
            <div style={{width:'36px',height:'36px',background:'#2a2a2a',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',fontSize:'16px'}}>💼</div>
            <p style={{color:'#fff',fontSize:'14px',fontWeight:500,margin:'0 0 4px'}}>Negocio</p>
            <p style={{color:'#444',fontSize:'11px',margin:0}}>Próximamente</p>
          </div>
        </div>

        <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'16px',padding:'16px'}}>
          <p style={{color:'#555',fontSize:'11px',margin:'0 0 12px',letterSpacing:'0.06em',textTransform:'uppercase'}}>Arriendos — este mes</p>

          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
            {aptosArriendados.map(apto => {
              const estado = getEstadoApto(apto)
              const pago = pagos.find(p => p.apartamento_id === apto.id)
              let dot = '#4ade80', badgeBg = '#1f3a2a', badgeColor = '#4ade80', badgeText = 'Al día'
              const fechaTexto = pago ? `corte ${formatFecha(pago.fecha_vencimiento)}` : 'sin corte'
              if (estado === 'atrasado') { dot='#f87171'; badgeBg='#2a0e0e'; badgeColor='#f87171'; badgeText='Atrasado' }
              else if (estado === 'vence_hoy') { dot='#facc15'; badgeBg='#2a2200'; badgeColor='#facc15'; badgeText='Vence hoy' }
              else if (estado === 'vence_manana') { dot='#facc15'; badgeBg='#2a2200'; badgeColor='#facc15'; badgeText='Vence mañana' }
              return (
                <div key={apto.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:dot,flexShrink:0}}/>
                    <p style={{color:'#ccc',fontSize:'12px',margin:0}}>{apto.nombre}</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <p style={{color:'#555',fontSize:'11px',margin:0}}>{fechaTexto}</p>
                    <span style={{background:badgeBg,color:badgeColor,fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>{badgeText}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{borderTop:'0.5px solid #2e2e2e',paddingTop:'12px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            <div><p style={{color:'#4ade80',fontSize:'18px',fontWeight:500,margin:'0 0 2px'}}>{alDia}</p><p style={{color:'#555',fontSize:'11px',margin:0}}>Al día</p></div>
            <div><p style={{color:'#facc15',fontSize:'18px',fontWeight:500,margin:'0 0 2px'}}>{porVencer}</p><p style={{color:'#555',fontSize:'11px',margin:0}}>Por vencer</p></div>
            <div><p style={{color:'#f87171',fontSize:'18px',fontWeight:500,margin:'0 0 2px'}}>{atrasados}</p><p style={{color:'#555',fontSize:'11px',margin:0}}>Atrasados</p></div>
          </div>
        </div>
      </div>
    </main>
  )
}
