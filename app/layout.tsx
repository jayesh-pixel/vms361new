import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ShipProvider } from "@/hooks/use-ships"
import { RequisitionProvider } from "@/hooks/use-requisitions"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VMS 361 - Vessel Management System",
  description: "Comprehensive vessel management system for fleet operations",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ShipProvider>
            <RequisitionProvider>
              {children}
              <Toaster />
            </RequisitionProvider>
          </ShipProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
