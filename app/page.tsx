"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (!loading && !hasRedirected) {
      setHasRedirected(true)
      if (user) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard')
      } else {
        // User is not logged in, redirect to login
        router.replace('/auth/login')
      }
    }
  }, [user, loading, router, hasRedirected])

  if (loading || hasRedirected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading VMS 361...</h2>
          <p className="text-gray-500 mt-2">Vessel Management System</p>
        </div>
      </div>
    )
  }

  return null
}
