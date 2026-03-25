'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type Pago = {
  id: string
  tipo: 'arriendo' | 'luz' | 'agua' | 'gas'
  fecha_vencimiento: string
  fecha_pago: string | null
  estado: 'pendiente' | 'pagado' | 'pagado_tarde'
  created_at: string
}

type Nota = {
  id: string
  contenido: string
  created_at: string
}

type Apartamento = {
  id: string
  nombre: string
  piso: number
}

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
)
const PlusIcon = ({ color = '#4ade80' }: { color?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)

function getTipoEmoji(tipo: string) {
  if (tipo === 'arriendo') return '🏠'
  if (tipo === 'luz') return '⚡'
  if (tipo === 'agua') return '💧'
  if (tipo === 'gas') return '🔥'
  return '📄'
}

function getTipoLabel(tipo: string) {
  if (tipo === 'arriendo') return 'Arriendo'
  if (tipo === 'luz') return 'Luz'
  if (tipo === 'agua') return 'Agua'
  if (tipo === 'gas') return 'Gas'
  return tipo
}

function getEstadoVencimiento(fecha: string): { texto: string; dot: string; badgeBg: string; badgeColor: string; borderColor: string } {
  const hoy = new Date()
  const vence = new Date(fecha)
  const diff = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { texto: `Vencido hace ${Math.abs(diff)} días`, dot: '#f87171', badgeBg: '#2a0e0e', badgeColor: '#f87171', borderColor: '#3a1010' }
  if (diff === 0) return { texto: 'Vence hoy', dot: '#facc15', badgeBg: '#2a2200', badgeColor: '#facc15', borderColor: '#3a3000' }
  if (diff === 1) return { texto: 'Vence mañana', dot: '#facc15', badgeBg: '#2a2200', badgeColor: '#facc15', borderColor: '#3a3000' }
  return { texto: `Vence en ${diff} días`, dot: '#4ade80', badgeBg: '#1f3a2a', badgeColor: '#4ade80', borderColor: '#2e2e2e' }
}

export default function AptoPage() {
  const router = useRouter()
  const { id } = useParams()
  const [apto, setApto] = useState<Apartamento | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [historial, setHistorial] = useState<Pago[]>([])
  const [notas, setNotas] = useState<Nota[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tipoPago, setTipoPago] = useState<'arriendo' | 'luz' | 'agua' | 'gas'>('luz')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  const esPisoFamiliar = apto?.piso === 3

  useEffect(() => {
    if (!getUser()) { router.push('/'); return }
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    const { data: aptoData } = await supabase.from('apartamentos').select('*').eq('id', id).single()
    const { data: pagosData } = await supabase.from('pagos').select('*').eq('apartamento_id', id).eq('estado', 'pendiente').order('fecha_vencimiento')
    const { data: historialData } = await supabase.from('pagos').select('*').eq('apartamento_id', id).neq('estado', 'pendiente').order('created_at', { ascending: false })
    const { data: notasData } = await supabase.from('notas').select('*').eq('apartamento_id', id).order('created_at', { ascending: false })
    if (aptoData) setApto(aptoData)
    if (pagosData) setPagos(pagosData)
    if (historialData) setHistorial(historialData)
    if (notasData) setNotas(notasData)
    setLoading(false)
  }

  async function marcarPagado(pago: Pago) {
    const hoy = new Date()
    const vence = new Date(pago.fecha_vencimiento)
    const estado = hoy > vence ? 'pagado_tarde' : 'pagado'
    await supabase.from('pagos').update({ estado, fecha_pago: hoy.toISOString().split('T')[0] }).eq('id', pago.id)
    cargarDatos()
  }

  async function agregarPago() {
    if (!fechaVencimiento) return
    await supabase.from('pagos').insert({ apartamento_id: id, tipo: tipoPago, fecha_vencimiento: fechaVencimiento, estado: 'pendiente' })
    setShowModal(false)
    setFechaVencimiento('')
    cargarDatos()
  }

  async function agregarNota() {
    if (!nuevaNota.trim()) return
    await supabase.from('notas').insert({ apartamento_id: id, contenido: nuevaNota.trim() })
    setNuevaNota('')
    cargarDatos()
  }

  async function eliminarNota(notaId: string) {
    await supabase.from('notas').delete().eq('id', notaId)
    cargarDatos()
  }

  const arriendoPendiente = pagos.find(p => p.tipo === 'arriendo')
  const serviciosPendientes = pagos.filter(p => p.tipo !== 'arriendo')
  const todosServicios: Array<'agua' | 'luz' | 'gas'> = ['agua', 'luz', 'gas']

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{background:'#0f0f0f'}}>
      <p style={{color:'#555',fontSize:'14px'}}>Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-4" style={{background:'#0f0f0f'}}>
      <div className="max-w-sm mx-auto">

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px',marginTop:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <button
              onClick={() => router.push('/casa')}
              style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'8px 14px',color:'#888',fontSize:'13px',cursor:'pointer'}}
            >
              <ArrowLeft /> Casa
            </button>
            <div>
              <h1 style={{color:'#fff',fontSize:'20px',fontWeight:500,margin:0}}>{apto?.nombre}</h1>
              {esPisoFamiliar && (
                <span style={{background:'#1f3a2a',color:'#4ade80',fontSize:'10px',padding:'2px 8px',borderRadius:'6px'}}>Piso familiar</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{background:'#1f3a2a',border:'none',borderRadius:'10px',width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
          >
            <PlusIcon />
          </button>
        </div>

        {/* ARRIENDO */}
        {!esPisoFamiliar && (
          <>
            <p style={{color:'#555',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.07em',margin:'0 0 10px'}}>Arriendo</p>
            {arriendoPendiente ? (() => {
              const est = getEstadoVencimiento(arriendoPendiente.fecha_vencimiento)
              return (
                <div style={{background:'#1a1a1a',border:`0.5px solid ${est.borderColor}`,borderRadius:'14px',padding:'16px',marginBottom:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'7px',height:'7px',borderRadius:'50%',background:est.dot,flexShrink:0}}/>
                      <span style={{color:'#fff',fontSize:'14px',fontWeight:500}}>
                        {new Date(arriendoPendiente.fecha_vencimiento).toLocaleDateString('es-CO', {month:'long',year:'numeric'})}
                      </span>
                    </div>
                    <span style={{background:est.badgeBg,color:est.badgeColor,fontSize:'11px',padding:'3px 10px',borderRadius:'7px'}}>{est.texto}</span>
                  </div>
                  <p style={{color:'#555',fontSize:'12px',margin:'0 0 14px 15px'}}>
                    Corte: {new Date(arriendoPendiente.fecha_vencimiento).toLocaleDateString('es-CO')}
                  </p>
                  <button
                    onClick={() => marcarPagado(arriendoPendiente)}
                    style={{width:'100%',background:'#1f3a2a',border:'none',borderRadius:'10px',padding:'11px',color:'#4ade80',fontSize:'13px',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}
                  >
                    <CheckIcon /> Marcar como pagado
                  </button>
                </div>
              )
            })() : (
              <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',padding:'16px',marginBottom:'20px',textAlign:'center'}}>
                <p style={{color:'#4ade80',fontSize:'13px',margin:0}}>✓ Arriendo al día</p>
              </div>
            )}
          </>
        )}

        {/* SERVICIOS */}
        <p style={{color:'#555',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.07em',margin:'0 0 10px'}}>Servicios</p>
        <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',overflow:'hidden',marginBottom:'20px'}}>
          {todosServicios.map((tipo, i) => {
            const pago = serviciosPendientes.find(p => p.tipo === tipo)
            const est = pago ? getEstadoVencimiento(pago.fecha_vencimiento) : null
            return (
              <div key={tipo} style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom: i < 2 ? '0.5px solid #222' : 'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'16px'}}>{getTipoEmoji(tipo)}</span>
                  <span style={{color:'#ccc',fontSize:'13px'}}>{getTipoLabel(tipo)}</span>
                </div>
                {pago && est ? (
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{color:'#555',fontSize:'11px'}}>{new Date(pago.fecha_vencimiento).toLocaleDateString('es-CO',{day:'numeric',month:'short'})}</span>
                    <button
                      onClick={() => marcarPagado(pago)}
                      style={{background:est.badgeBg,border:'none',color:est.badgeColor,fontSize:'11px',padding:'3px 10px',borderRadius:'7px',cursor:'pointer'}}
                    >
                      {est.texto}
                    </button>
                  </div>
                ) : (
                  <span style={{background:'#1f3a2a',color:'#4ade80',fontSize:'11px',padding:'3px 10px',borderRadius:'7px'}}>Al día</span>
                )}
              </div>
            )
          })}
        </div>

        {/* HISTORIAL */}
        <p style={{color:'#555',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.07em',margin:'0 0 10px'}}>Historial</p>
        <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',overflow:'hidden',marginBottom:'20px'}}>
          {historial.length === 0 ? (
            <div style={{padding:'20px',textAlign:'center'}}>
              <p style={{color:'#555',fontSize:'13px',margin:0}}>Sin historial todavía</p>
            </div>
          ) : historial.map((pago, i) => (
            <div key={pago.id} style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom: i < historial.length - 1 ? '0.5px solid #222' : 'none'}}>
              <div>
                <p style={{color:'#ccc',fontSize:'13px',margin:'0 0 2px',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span>{getTipoEmoji(pago.tipo)}</span>
                  <span style={{textTransform:'capitalize'}}>{getTipoLabel(pago.tipo)} — {new Date(pago.fecha_vencimiento).toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</span>
                </p>
                <p style={{color:'#555',fontSize:'11px',margin:0}}>
                  {pago.fecha_pago ? `Pagó el ${new Date(pago.fecha_pago).toLocaleDateString('es-CO')}` : `Venció: ${new Date(pago.fecha_vencimiento).toLocaleDateString('es-CO')}`}
                </p>
              </div>
              {pago.estado === 'pagado'
                ? <span style={{background:'#1f3a2a',color:'#4ade80',fontSize:'11px',padding:'3px 10px',borderRadius:'7px'}}>A tiempo ✓</span>
                : <span style={{background:'#2a0e0e',color:'#f87171',fontSize:'11px',padding:'3px 10px',borderRadius:'7px'}}>Tarde ✗</span>
              }
            </div>
          ))}
        </div>

        {/* NOTAS */}
        <p style={{color:'#555',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.07em',margin:'0 0 10px'}}>Notas</p>
        <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',padding:'14px',marginBottom:'12px'}}>
          <textarea
            value={nuevaNota}
            onChange={e => setNuevaNota(e.target.value)}
            placeholder="Escribe una nota..."
            style={{width:'100%',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#fff',outline:'none',resize:'none',height:'80px',boxSizing:'border-box',fontFamily:'inherit'}}
          />
          <button
            onClick={agregarNota}
            style={{width:'100%',background:'#1a1a1a',border:'0.5px solid #2e5e3a',borderRadius:'10px',padding:'10px',color:'#4ade80',fontSize:'13px',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',marginTop:'8px'}}
          >
            <PlusIcon /> Agregar nota
          </button>
        </div>
        {notas.map((nota, i) => (
          <div key={nota.id} style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'14px',padding:'14px',marginBottom:'8px'}}>
            <p style={{color:'#ccc',fontSize:'13px',margin:'0 0 8px'}}>{nota.contenido}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{color:'#555',fontSize:'11px',margin:0}}>{new Date(nota.created_at).toLocaleDateString('es-CO')}</p>
              <button onClick={() => eliminarNota(nota.id)} style={{background:'none',border:'none',color:'#f87171',fontSize:'12px',cursor:'pointer',padding:0}}>Eliminar</button>
            </div>
          </div>
        ))}

      </div>

      {/* MODAL AGREGAR PAGO */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',zIndex:50}}>
          <div style={{background:'#1a1a1a',border:'0.5px solid #2e2e2e',borderRadius:'20px',padding:'24px',width:'100%',maxWidth:'360px'}}>
            <h2 style={{color:'#fff',fontSize:'16px',fontWeight:500,margin:'0 0 20px'}}>Agregar pago</h2>
            <div style={{marginBottom:'12px'}}>
              <label style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px'}}>Tipo</label>
              <select
                value={tipoPago}
                onChange={e => setTipoPago(e.target.value as 'arriendo' | 'luz' | 'agua' | 'gas')}
                style={{width:'100%',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#fff',outline:'none'}}
              >
                {!esPisoFamiliar && <option value="arriendo">🏠 Arriendo</option>}
                <option value="agua">💧 Agua</option>
                <option value="luz">⚡ Luz</option>
                <option value="gas">🔥 Gas</option>
              </select>
            </div>
            <div style={{marginBottom:'20px'}}>
              <label style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px'}}>Fecha de vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                style={{width:'100%',background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#fff',outline:'none',boxSizing:'border-box'}}
              />
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button
                onClick={() => setShowModal(false)}
                style={{flex:1,background:'#111',border:'0.5px solid #2e2e2e',borderRadius:'10px',padding:'11px',color:'#888',fontSize:'13px',cursor:'pointer'}}
              >
                Cancelar
              </button>
              <button
                onClick={agregarPago}
                style={{flex:1,background:'#166534',border:'none',borderRadius:'10px',padding:'11px',color:'#4ade80',fontSize:'13px',fontWeight:500,cursor:'pointer'}}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
