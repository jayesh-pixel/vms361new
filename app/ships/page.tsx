"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ship, Search, Filter, Plus, MoreHorizontal, MapPin, Users, Calendar, Settings } from "lucide-react"
import type { Ship as ShipType } from "@/lib/types"

export default function ShipsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Mock ships data
  const ships: ShipType[] = [
    {
      id: "1",
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
    },
    // Add more ships...
  ]

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

  const handleManageShip = (ship: ShipType) => {
    router.push(`/ships/${ship.id}`)
  }

  const filteredShips = ships.filter(ship => {
    const matchesSearch = ship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ship.imo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || ship.status === statusFilter
    const matchesType = typeFilter === "all" || ship.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <DashboardLayout currentPage="ships">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fleet Management</h1>
            <p className="text-slate-600 mt-1">Manage and monitor your entire fleet</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Ship
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search ships by name or IMO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="at_sea">At Sea</SelectItem>
                  <SelectItem value="in_port">In Port</SelectItem>
                  <SelectItem value="anchored">Anchored</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                  <SelectItem value="bulk_carrier">Bulk Carrier</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="cargo">Cargo</SelectItem>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="offshore">Offshore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShips.map((ship) => (
            <Card key={ship.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <Ship className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ship.name}</CardTitle>
                      <p className="text-sm text-slate-600">{ship.imo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(ship.status)}>
                      {getStatusText(ship.status)}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleManageShip(ship)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span>{ship.location.port || `${ship.location.lat.toFixed(2)}, ${ship.location.lng.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>{ship.crew.length} crew members</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {ship.location.lastUpdate.toLocaleDateString()}</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="ml-1 font-medium capitalize">{ship.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Flag:</span>
                        <span className="ml-1 font-medium">{ship.flag}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">DWT:</span>
                        <span className="ml-1 font-medium">{ship.specifications.deadweight.toLocaleString()}t</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Year:</span>
                        <span className="ml-1 font-medium">{ship.specifications.yearBuilt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredShips.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Ship className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No ships found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
