import 'server-only'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function verifySession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    return session
  } catch (error) {
    console.error("Error verifying session:", error)
    return null
  }
}
