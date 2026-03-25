import { supabase } from './supabase'

export async function login(username: string, password: string) {
  console.log('Intentando login con usuario:', username)
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('username', username)
    .single()

  console.log('Resultado de Supabase:', { data, error })

  if (error || !data) return { error: 'Usuario no encontrado' }

  const bcrypt = await import('bcryptjs')
  console.log('Hash en BD:', data.password_hash)
  
  const valid = await bcrypt.compare(password, data.password_hash)
  console.log('Password válido:', valid)

  if (!valid) return { error: 'Contraseña incorrecta' }

  localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username }))
  return { user: data }
}

export function logout() {
  localStorage.removeItem('user')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}