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

export default function AptoPage() {
  const router = useRouter()
  const { id } = useParams()
  const [apto, setApto] = useState<Apartamento | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [historial, setHistorial] = useState<Pago[]>([])
  const [notas, setNotas] = useState<Nota[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pagos' | 'historial' | 'notas'>('pagos')
  const [showModal, setShowModal] = useState(false)
  const [tipoPago, setTipoPago] = useState<'arriendo' | 'luz' | 'agua' | 'gas'>('luz')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  const esPisoFamiliar = apto?.piso === 3

  useEffect(() => {
    if (!getUser()) { router.push('/'); return }
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    const { data: aptoData } = await supabase
      .from('apartamentos')
      .select('*')
      .eq('id', id)
      .single()

    const { data: pagosData } = await supabase
      .from('pagos')
      .select('*')
      .eq('apartamento_id', id)
      .eq('estado', 'pendiente')
      .order('fecha_vencimiento')

    const { data: historialData } = await supabase
      .from('pagos')
      .select('*')
      .eq('apartamento_id', id)
      .neq('estado', 'pendiente')
      .order('created_at', { ascending: false })

    const { data: notasData } = await supabase
      .from('notas')
      .select('*')
      .eq('apartamento_id', id)
      .order('created_at', { ascending: false })

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
    await supabase
      .from('pagos')
      .update({ estado, fecha_pago: hoy.toISOString().split('T')[0] })
      .eq('id', pago.id)
    cargarDatos()
  }

  async function agregarPago() {
    if (!fechaVencimiento) return
    await supabase.from('pagos').insert({
      apartamento_id: id,
      tipo: tipoPago,
      fecha_vencimiento: fechaVencimiento,
      estado: 'pendiente'
    })
    setShowModal(false)
    setFechaVencimiento('')
    cargarDatos()
  }

  async function agregarNota() {
    if (!nuevaNota.trim()) return
    await supabase.from('notas').insert({
      apartamento_id: id,
      contenido: nuevaNota.trim()
    })
    setNuevaNota('')
    cargarDatos()
  }

  async function eliminarNota(notaId: string) {
    await supabase.from('notas').delete().eq('id', notaId)
    cargarDatos()
  }

  function getEstadoBadge(estado: string) {
    if (estado === 'pagado') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">A tiempo</span>
    if (estado === 'pagado_tarde') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Pagó tarde</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pendiente</span>
  }

  function getVencimientoLabel(fecha: string) {
    const hoy = new Date()
    const vence = new Date(fecha)
    const diff = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return <span className="text-xs text-red-600">Vencido hace {Math.abs(diff)} días</span>
    if (diff === 0) return <span className="text-xs text-red-600">Vence hoy</span>
    if (diff === 1) return <span className="text-xs text-amber-600">Vence mañana</span>
    return <span className="text-xs text-gray-400">Vence en {diff} días</span>
  }

  function getTipoEmoji(tipo: string) {
    if (tipo === 'arriendo') return '🏠'
    if (tipo === 'luz') return '💡'
    if (tipo === 'agua') return '💧'
    if (tipo === 'gas') return '🔥'
    return '📄'
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto">

        <div className="flex items-center gap-3 mb-6 mt-4">
          <button onClick={() => router.push('/casa')} className="text-sm text-gray-400 hover:text-gray-600">← Casa</button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">{apto?.nombre}</h1>
            {esPisoFamiliar && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Piso familiar</span>
            )}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(['pagos', 'historial', 'notas'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'pagos' && (
          <div className="space-y-3">
            {pagos.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm">No hay pagos pendientes</p>
              </div>
            )}
            {pagos.map(pago => (
              <div key={pago.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTipoEmoji(pago.tipo)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{pago.tipo}</p>
                      {getVencimientoLabel(pago.fecha_vencimiento)}
                    </div>
                  </div>
                  {getEstadoBadge(pago.estado)}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-CO')}
                </p>
                <button
                  onClick={() => marcarPagado(pago)}
                  className="w-full border border-green-600 text-green-700 rounded-lg py-2 text-xs font-medium hover:bg-green-50 transition-colors"
                >
                  ✓ Marcar como pagado
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-green-700 text-green-50 rounded-xl py-2.5 text-sm font-medium hover:bg-green-800 transition-colors"
            >
              + Agregar pago
            </button>
          </div>
        )}

        {tab === 'historial' && (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {historial.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm">Sin historial todavía</p>
              </div>
            )}
            {historial.map(pago => (
              <div key={pago.id} className="flex justify-between items-center p-3">
                <div>
                  <p className="text-sm text-gray-700 flex items-center gap-1">
                    {getTipoEmoji(pago.tipo)} <span className="capitalize">{pago.tipo}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Venció: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-CO')}
                    {pago.fecha_pago && ` · Pagó: ${new Date(pago.fecha_pago).toLocaleDateString('es-CO')}`}
                  </p>
                </div>
                {getEstadoBadge(pago.estado)}
              </div>
            ))}
          </div>
        )}

        {tab === 'notas' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <textarea
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Escribe una nota..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white resize-none h-20 focus:outline-none focus:border-green-500"
              />
              <button
                onClick={agregarNota}
                className="w-full bg-green-700 text-green-50 rounded-lg py-2 text-sm font-medium hover:bg-green-800 transition-colors mt-2"
              >
                + Agregar nota
              </button>
            </div>
            {notas.map(nota => (
              <div key={nota.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-sm text-gray-700">{nota.contenido}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(nota.created_at).toLocaleDateString('es-CO')}
                  </p>
                  <button
                    onClick={() => eliminarNota(nota.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-medium text-gray-900 mb-4">Agregar pago</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Tipo</label>
                <select
                  value={tipoPago}
                  onChange={e => setTipoPago(e.target.value as 'arriendo' | 'luz' | 'agua' | 'gas')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
                >
                  {!esPisoFamiliar && <option value="arriendo">🏠 Arriendo</option>}
                  <option value="luz">💡 Luz</option>
                  <option value="agua">💧 Agua</option>
                  <option value="gas">🔥 Gas</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={agregarPago}
                className="flex-1 bg-green-700 text-green-50 rounded-lg py-2 text-sm font-medium"
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