"use client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Settings, Activity, Database, Lock, AlertTriangle, CheckCircle } from "lucide-react"

export default function AdminPage() {
  const systemStats = {
    totalUsers: 45,
    activeUsers: 38,
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
    { role: "Admin", count: 3, color: "bg-red-100 text-red-800" },
    { role: "Fleet Manager", count: 8, color: "bg-blue-100 text-blue-800" },
    { role: "Captain", count: 12, color: "bg-green-100 text-green-800" },
    { role: "Crew", count: 18, color: "bg-yellow-100 text-yellow-800" },
    { role: "Port Agent", count: 4, color: "bg-purple-100 text-purple-800" }
  ]

  return (
    <DashboardLayout currentPage="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
            <p className="text-slate-600 mt-1">Manage users, monitor system health, and configure settings</p>
          </div>
          <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
            <Shield className="h-4 w-4 mr-2" />
            Admin Panel
          </Button>
        </div>

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
              <Button variant="outline" className="w-full mt-4">
                Manage Users
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
