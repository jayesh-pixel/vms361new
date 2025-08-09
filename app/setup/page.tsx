"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Ship, Settings } from 'lucide-react'

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    setupToken: '',
    companyName: '',
    adminEmail: '',
    adminDisplayName: ''
  })
  
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Setup completed successfully! Redirecting to admin panel...')
        setTimeout(() => {
          router.push('/dashboard/admin')
        }, 2000)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (error) {
      setError('Setup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Ship className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">VMS 361 Setup</h1>
          <p className="text-sm text-gray-600 mt-2">Initialize your vessel management system</p>
        </div>

        {/* Setup Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
              <Settings className="h-5 w-5" />
              Initial Setup
            </CardTitle>
            <CardDescription>
              Set up your company and admin account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="setupToken">Setup Token</Label>
                <Input
                  id="setupToken"
                  name="setupToken"
                  type="password"
                  placeholder="Enter setup token (setup123)"
                  value={formData.setupToken}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">Use: setup123</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  This should be your currently registered email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminDisplayName">Admin Display Name</Label>
                <Input
                  id="adminDisplayName"
                  name="adminDisplayName"
                  type="text"
                  placeholder="Your full name"
                  value={formData.adminDisplayName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-500">
          <p className="mb-2">
            This is a one-time setup to initialize your VMS 361 system.
          </p>
          <p>
            Make sure you have already registered with Firebase Auth before running this setup.
          </p>
        </div>
      </div>
    </div>
  )
}
