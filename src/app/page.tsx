"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/context/auth-context"

export default function RootPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (session?.user) {
        // User is authenticated, redirect to home
        router.push("/home")
      } else {
        // User is not authenticated, redirect to signin
        router.push("/signin")
      }
    }
  }, [session, loading, router])

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner variant="bars" size={32} className="mx-auto text-primary" />
        <p className="text-muted-foreground">Making...</p>
      </div>
    </div>
  )
}
