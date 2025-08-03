"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Ship, 
  ArrowLeft, 
  MapPin, 
  Users, 
  Calendar, 
  FileText,
  Package,
  ClipboardList,
  Bell,
  UserCheck,
  Clock,
  Settings,
  Award,
  Wrench
} from "lucide-react"
import type { Ship as ShipType } from "@/lib/types"

interface ShipDetailsPageProps {
  params: {
    id: string
  }
}

export default function ShipDetailsPage({ params }: ShipDetailsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Mock ship data - in real app, fetch by params.id
  const ship: ShipType = {
    id: params.id,
    name: "MV Atlantic Pioneer",
    imo: "IMO9234567",
    flag: "Panama",
    type: "container",
    status: "at_sea",
    location: {
      lat: 40.7128,
      lng: -74.0060,
      port: "New York",
      lastUpdate: new Date("2024-01-15")
    },
    specifications: {
      length: 300,
      beam: 48,
      draft: 14.5,
      deadweight: 85000,
      grossTonnage: 95000,
      yearBuilt: 2018
    },
    crew: [],
    certificates: [],
    inventory: [],
    requisitions: [],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

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

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <DashboardLayout currentPage="ships">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{ship.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-600">{ship.imo}</p>
                <Badge className={getStatusColor(ship.status)}>
                  {getStatusText(ship.status)}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Ship Settings
          </Button>
        </div>

        {/* Ship Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Current Location</p>
                  <p className="font-semibold">{ship.location.port || "At Sea"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Crew Members</p>
                  <p className="font-semibold">{ship.crew.length} Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Ship className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Deadweight</p>
                  <p className="font-semibold">{ship.specifications.deadweight.toLocaleString()}t</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Year Built</p>
                  <p className="font-semibold">{ship.specifications.yearBuilt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs">
              <Ship className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2 text-xs">
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="drawings" className="flex items-center gap-2 text-xs">
              <FileText className="h-4 w-4" />
              Drawings
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="material-req" className="flex items-center gap-2 text-xs">
              <ClipboardList className="h-4 w-4" />
              Material Req
            </TabsTrigger>
            <TabsTrigger value="service-req" className="flex items-center gap-2 text-xs">
              <Wrench className="h-4 w-4" />
              Service Req
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2 text-xs">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2 text-xs">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="crew" className="flex items-center gap-2 text-xs">
              <UserCheck className="h-4 w-4" />
              Crew
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2 text-xs">
              <Clock className="h-4 w-4" />
              Scheduling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ship Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Ship Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Length</p>
                      <p className="font-semibold">{ship.specifications.length}m</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Beam</p>
                      <p className="font-semibold">{ship.specifications.beam}m</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Draft</p>
                      <p className="font-semibold">{ship.specifications.draft}m</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Gross Tonnage</p>
                      <p className="font-semibold">{ship.specifications.grossTonnage.toLocaleString()}t</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Ship Type</p>
                      <p className="font-semibold capitalize">{ship.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Flag State</p>
                      <p className="font-semibold">{ship.flag}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Location Update</p>
                        <p className="text-xs text-slate-600">Updated position at {ship.location.lastUpdate.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Certificate Renewal</p>
                        <p className="text-xs text-slate-600">Safety certificate renewed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="h-2 w-2 bg-orange-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Maintenance Scheduled</p>
                        <p className="text-xs text-slate-600">Engine maintenance scheduled for next port</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Ship Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Certificate management system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawings">
            <Card>
              <CardHeader>
                <CardTitle>Drawings & Part Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Technical drawings and part number database coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory & Store</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Inventory management system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="material-req">
            <Card>
              <CardHeader>
                <CardTitle>Material Requisitions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Material requisition system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service-req">
            <Card>
              <CardHeader>
                <CardTitle>Service Requisitions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Service requisition system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders">
            <Card>
              <CardHeader>
                <CardTitle>Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Reminder system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Duty List & Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Task management system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crew">
            <Card>
              <CardHeader>
                <CardTitle>Crew Register</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Crew management system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduling">
            <Card>
              <CardHeader>
                <CardTitle>Shift & Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Scheduling system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
