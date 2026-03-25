'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    if (!getUser()) router.push('/')
  }, [router])

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto">
        <div className="mb-6 mt-4">
          <h1 className="text-xl font-medium text-gray-900">Bienvenido 👋</h1>
          <p className="text-sm text-gray-500">¿Qué quieres gestionar hoy?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/casa">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">
                🏠
              </div>
              <p className="font-medium text-gray-900 text-sm">Casa</p>
              <p className="text-xs text-gray-400 mt-1">4 pisos · 4 aptos</p>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">
              💼
            </div>
            <p className="font-medium text-gray-900 text-sm">Negocio</p>
            <p className="text-xs text-gray-400 mt-1">Próximamente</p>
          </div>
        </div>
      </div>
    </main>
  )
}