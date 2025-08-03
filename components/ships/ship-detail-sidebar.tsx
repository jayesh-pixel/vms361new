"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  FileText,
  Image,
  Package,
  ClipboardList,
  Wrench,
  Bell,
  CheckSquare,
  Users,
  Calendar,
  X,
  Ship as ShipIcon,
  MapPin,
  Flag,
  Clock,
  Settings
} from "lucide-react"
import type { Ship } from "@/lib/types"

interface ShipDetailSidebarProps {
  ship: Ship
  isOpen: boolean
  onClose: () => void
}

export function ShipDetailSidebar({ ship, isOpen, onClose }: ShipDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "at_sea":
        return "bg-blue-100 text-blue-800"
      case "in_port":
        return "bg-green-100 text-green-800"
      case "anchored":
        return "bg-yellow-100 text-yellow-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "certificates", label: "Certificates", icon: FileText },
    { id: "drawings", label: "Drawings + Part No.", icon: Image },
    { id: "inventory", label: "Inventory / Store", icon: Package },
    { id: "material-req", label: "Material Requisition", icon: ClipboardList },
    { id: "service-req", label: "Service Requisition", icon: Wrench },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "tasks", label: "Duty List / Tasks", icon: CheckSquare },
    { id: "crew", label: "Crew Register", icon: Users },
    { id: "scheduling", label: "Shift & Scheduling", icon: Calendar },
  ]

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ShipIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{ship.name}</h2>
                <p className="text-sm text-blue-100">{ship.imo}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Ship Status */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{ship.location.port || `${ship.location.lat.toFixed(2)}, ${ship.location.lng.toFixed(2)}`}</span>
            </div>
            <Badge className={`${getStatusColor(ship.status)} border-none`}>
              {ship.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <ScrollArea className="w-full">
            <div className="p-2">
              <div className="space-y-1">
                {sidebarTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start gap-2 text-left ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {activeTab === "dashboard" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Ship Overview</h3>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{ship.crew.length}</div>
                      <div className="text-xs text-slate-600">Crew Members</div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{ship.tasks.length}</div>
                      <div className="text-xs text-slate-600">Active Tasks</div>
                    </div>
                  </Card>
                </div>

                {/* Ship Specifications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Length:</span>
                      <span className="font-medium">{ship.specifications.length}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Beam:</span>
                      <span className="font-medium">{ship.specifications.beam}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Draft:</span>
                      <span className="font-medium">{ship.specifications.draft}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">DWT:</span>
                      <span className="font-medium">{ship.specifications.deadweight.toLocaleString()}t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">GT:</span>
                      <span className="font-medium">{ship.specifications.grossTonnage.toLocaleString()}t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Built:</span>
                      <span className="font-medium">{ship.specifications.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Flag:</span>
                      <span className="font-medium">{ship.flag}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Location updated - {ship.location.lastUpdate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Crew check-in completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Maintenance scheduled</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "certificates" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Certificates</h3>
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Ship certificates will be managed here</p>
                  <Button size="sm" className="mt-2">Add Certificate</Button>
                </div>
              </div>
            )}

            {activeTab === "drawings" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Drawings & Part Numbers</h3>
                <div className="text-center py-8">
                  <Image className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Technical drawings and part catalogs</p>
                  <Button size="sm" className="mt-2">Upload Drawing</Button>
                </div>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Inventory / Store</h3>
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Ship inventory and store management</p>
                  <Button size="sm" className="mt-2">Manage Inventory</Button>
                </div>
              </div>
            )}

            {activeTab === "material-req" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Material Requisition</h3>
                <div className="text-center py-8">
                  <ClipboardList className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Material and supply requests</p>
                  <Button size="sm" className="mt-2">New Requisition</Button>
                </div>
              </div>
            )}

            {activeTab === "service-req" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Service Requisition</h3>
                <div className="text-center py-8">
                  <Wrench className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Service and maintenance requests</p>
                  <Button size="sm" className="mt-2">Request Service</Button>
                </div>
              </div>
            )}

            {activeTab === "reminders" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Reminders</h3>
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Important reminders and alerts</p>
                  <Button size="sm" className="mt-2">Add Reminder</Button>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Duty List / Tasks</h3>
                <div className="text-center py-8">
                  <CheckSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Daily tasks and duty assignments</p>
                  <Button size="sm" className="mt-2">Assign Task</Button>
                </div>
              </div>
            )}

            {activeTab === "crew" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Crew Register</h3>
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Crew members assigned to this ship</p>
                  <Button size="sm" className="mt-2">Manage Crew</Button>
                </div>
              </div>
            )}

            {activeTab === "scheduling" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Shift & Scheduling</h3>
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Work shifts and crew scheduling</p>
                  <Button size="sm" className="mt-2">Create Schedule</Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
