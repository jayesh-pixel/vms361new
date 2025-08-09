"use client"
import { useState, useEffect } from 'react'
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, Settings, Activity, Database, Lock, AlertTriangle, CheckCircle, Plus, Edit, Trash2, Mail } from "lucide-react"
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'

export default function AdminPage() {
  const { user } = useAuth()
  const { canManageUsers, canManageCompanySettings, isAdmin, isOwner, userPermissions } = usePermissions()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    password: '',
    companyRole: 'viewer'
  })

  const systemStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => u.isActive).length,
    systemHealth: "Good",
    databaseSize: "2.4 GB",
    lastBackup: "2 hours ago",
    uptime: "99.9%"
  }

  const recentActivities = [
    {
      id: "1",
      action: "User Login",
      user: "captain.smith@shipping.com",
      timestamp: "5 minutes ago",
      status: "success"
    },
    {
      id: "2", 
      action: "Ship Added",
      user: "admin@shipping.com",
      details: "MV Ocean Explorer",
      timestamp: "1 hour ago",
      status: "success"
    },
    {
      id: "3",
      action: "Failed Login Attempt",
      user: "unknown@email.com",
      timestamp: "2 hours ago", 
      status: "warning"
    },
    {
      id: "4",
      action: "Database Backup",
      user: "system",
      timestamp: "2 hours ago",
      status: "success"
    }
  ]

  const userRoles = [
    { role: "Owner", count: users.filter((u: any) => u.companyRole === 'owner').length, color: "bg-red-100 text-red-800" },
    { role: "Admin", count: users.filter((u: any) => u.companyRole === 'admin').length, color: "bg-blue-100 text-blue-800" },
    { role: "HR", count: users.filter((u: any) => u.companyRole === 'hr').length, color: "bg-green-100 text-green-800" },
    { role: "Procurement", count: users.filter((u: any) => u.companyRole === 'procurement').length, color: "bg-yellow-100 text-yellow-800" },
    { role: "Finance", count: users.filter((u: any) => u.companyRole === 'finance').length, color: "bg-purple-100 text-purple-800" },
    { role: "Viewer", count: users.filter((u: any) => u.companyRole === 'viewer').length, color: "bg-gray-100 text-gray-800" }
  ]

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      const token = await user?.getIdToken()
      if (!token) {
        console.log('No token available')
        return
      }

      console.log('Fetching users with token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Users data:', data)
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = await user?.getIdToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      console.log('Creating user:', newUser)
      console.log('Token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      console.log('Create user response status:', response.status)
      const data = await response.json()
      console.log('Create user response data:', data)

      if (response.ok) {
        setSuccess('User created successfully!')
        setShowCreateUser(false)
        setNewUser({
          email: '',
          displayName: '',
          password: '',
          companyRole: 'viewer'
        })
        fetchUsers() // Refresh users list
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Create user error:', error)
      setError('Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = await user?.getIdToken()
      if (!token) return

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        fetchUsers() // Refresh users list
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  // Check if user has admin access
  if (!isAdmin() && !isOwner()) {
    return (
      <DashboardLayout currentPage="admin">
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You don't have permission to access the administration panel.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
            <p className="text-slate-600 mt-1">Manage users, monitor system health, and configure settings</p>
          </div>
          <div className="flex gap-3">
            {canManageUsers() && (
              <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to your organization with appropriate roles.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="displayName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="displayName"
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="col-span-3"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select value={newUser.companyRole} onValueChange={(value) => setNewUser({...newUser, companyRole: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="procurement">Procurement</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            )}
            
            <Button variant="outline" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border-0">
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{systemStats.totalUsers}</div>
              <div className="text-sm text-slate-600 mt-1">
                {systemStats.activeUsers} active users
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStats.systemHealth}</div>
              <div className="text-sm text-slate-600 mt-1">
                Uptime: {systemStats.uptime}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Database</CardTitle>
                <Database className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{systemStats.databaseSize}</div>
              <div className="text-sm text-slate-600 mt-1">
                Last backup: {systemStats.lastBackup}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Roles Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRoles.map((roleData) => (
                  <div key={roleData.role} className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{roleData.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{roleData.count} users</span>
                      <Badge className={roleData.color}>{roleData.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowCreateUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900">
                        {activity.action}
                        {activity.details && <span className="text-slate-600"> - {activity.details}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {activity.user} • {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </div>
              <Button size="sm" onClick={fetchUsers}>
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((userData: any) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">{userData.displayName}</TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {userData.companyRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={userData.isActive ? "default" : "destructive"}
                            className={userData.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {userData.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(userData.createdAt.seconds * 1000).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserStatus(userData.id, userData.isActive)}
                            >
                              {userData.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found. Create your first user to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* System Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">System Settings</h3>
                  <p className="text-sm text-slate-600">Configure global system preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Database Management</h3>
                  <p className="text-sm text-slate-600">Backup, restore, and optimize</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Security Settings</h3>
                  <p className="text-sm text-slate-600">Manage access and permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">System Alerts</h3>
                  <p className="text-sm text-slate-600">Configure notifications and alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">System Monitoring</h3>
                  <p className="text-sm text-slate-600">View performance metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">User Management</h3>
                  <p className="text-sm text-slate-600">Add, edit, and manage users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
