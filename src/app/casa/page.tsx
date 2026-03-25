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
    const { data: aptos } = await supabase
      .from('apartamentos')
      .select('*')
      .order('piso')

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
        .from('pagos')
        .select('*')
        .eq('apartamento_id', apto.id)
        .eq('estado', 'pendiente')

      if (!pagos || pagos.length === 0) {
        estadosPisos[apto.piso] = 'al_dia'
        continue
      }

      for (const pago of pagos) {
        const vence = new Date(pago.fecha_vencimiento)
        if (vence < hoy) {
          estadosPisos[apto.piso] = 'vencido'
        } else if (vence.toDateString() === manana.toDateString()) {
          if (estadosPisos[apto.piso] !== 'vencido')
            estadosPisos[apto.piso] = 'por_vencer'
        } else {
          if (!estadosPisos[apto.piso])
            estadosPisos[apto.piso] = 'al_dia'
        }
      }
    }
    setEstados(estadosPisos)
  }

  const pisos = [1, 2, 3, 4]

  function getBadge(piso: number, esPropio: boolean) {
    if (esPropio) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Nuestro</span>
    const e = estados[piso]
    if (e === 'vencido') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Vencido</span>
    if (e === 'por_vencer') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Vence mañana</span>
    if (e === 'tarde') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Pagó tarde</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Al día</span>
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
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">← Inicio</button>
          <h1 className="text-xl font-medium text-gray-900">Casa</h1>
        </div>

        <div className="bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2 mb-4">
          <span className="text-green-700 text-xs">📱 Alertas activas — 1 día antes de cada vencimiento</span>
        </div>

        <div className="space-y-3">
          {pisos.map(piso => {
            const aptosDelPiso = apartamentos.filter(a => a.piso === piso)
            const esPropio = aptosDelPiso.some(a => a.es_propio)
            return (
              <div key={piso} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900 text-sm">Piso {piso}</span>
                  {getBadge(piso, esPropio)}
                </div>
                {aptosDelPiso.filter(a => !a.es_propio).map(apto => (
                  <Link key={apto.id} href={`/casa/apto/${apto.id}`}>
                    <div className="flex justify-between items-center py-2 border-t border-gray-100 hover:bg-gray-50 cursor-pointer rounded px-1">
                      <span className="text-sm text-gray-600">{apto.nombre}</span>
                      <span className="text-xs text-green-700">Ver →</span>
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