"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <Image
              src="/logo.png"
              alt="Mintward Logo"
              fill
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <Spinner variant="bars" size={32} className="text-primary" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
