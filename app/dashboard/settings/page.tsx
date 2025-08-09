"use client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, User, Bell, Shield, Globe, Palette, Lock } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

export default function SettingsPage() {
  const { canManageCompanySettings, isOwner, isAdmin } = usePermissions()

  return (
    <DashboardLayout currentPage="settings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Manage your preferences and system configuration</p>
          </div>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Profile Settings</h3>
                  <p className="text-sm text-slate-600">Manage your account and personal information</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-600">Configure alerts and notification preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(canManageCompanySettings() || isOwner() || isAdmin()) && (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Security</h3>
                      <p className="text-sm text-slate-600">Password, two-factor authentication, and security</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Regional Settings</h3>
                      <p className="text-sm text-slate-600">Language, timezone, and regional preferences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Appearance</h3>
                  <p className="text-sm text-slate-600">Theme, layout, and display preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">System Preferences</h3>
                  <p className="text-sm text-slate-600">Application behavior and system settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Settings Configuration</h3>
              <p className="text-slate-600">This section will contain detailed settings and configuration options.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
