"use client"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  Ship,
  Users,
  FileText,
  Package,
  Settings,
  FolderOpen,
  Shield,
  Menu,
  Bell,
  Search,
  User,
  LogOut
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

const navigationItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
    description: "Overview and analytics"
  },
  {
    title: "Ships",
    icon: Ship,
    href: "/dashboard/ships",
    description: "Fleet management"
  },
  {
    title: "Crew",
    icon: Users,
    href: "/dashboard/crew",
    description: "Personnel management"
  },
  {
    title: "Requisition",
    icon: FileText,
    href: "/dashboard/requisition",
    description: "Material & service requests"
  },
  {
    title: "Stock / Inventory",
    icon: Package,
    href: "/dashboard/inventory",
    description: "Parts and supplies"
  },
  {
    title: "Admin",
    icon: Shield,
    href: "/dashboard/admin",
    description: "System administration"
  },
  {
    title: "Projects",
    icon: FolderOpen,
    href: "/dashboard/projects",
    description: "Project management"
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    description: "System preferences"
  },
]

function Sidebar({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (href: string) => {
    router.push(href)
  }
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        {/* Logo/Brand */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Ship Manager</h2>
              <p className="text-xs text-slate-600">Global Fleet Control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2 h-auto text-left transition-colors",
                    isActive 
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100" 
                      : "hover:bg-blue-50 hover:text-blue-700"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-slate-500 truncate">{item.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Mobile menu */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <ScrollArea className="h-full">
                <Sidebar />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-10 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search ships, crew, or tasks..."
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              3
            </div>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback>
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-slate-600">
                    {user?.email || 'user@vms361.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Always visible logout button */}
          <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 border-r bg-white">
            <ScrollArea className="flex-1">
              <Sidebar />
            </ScrollArea>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 md:pl-80">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
