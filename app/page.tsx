"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import EarthMap3D, { type EarthMap3DRef } from "@/components/react-earth-map-3d"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { StatsCards, AlertsWidget } from "@/components/dashboard/stats-cards"
import { ShipCards } from "@/components/dashboard/ship-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ship, DashboardStats } from "@/lib/types"

export default function ShipManagementDashboard() {
  const mapRef = useRef<EarthMap3DRef>(null)
  const router = useRouter()
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
  const [showAddShipDialog, setShowAddShipDialog] = useState(false)

  // Mock data for demonstration
  const dashboardStats: DashboardStats = {
    totalShips: 24,
    activeCrew: 892,
    pendingRequisitions: 15,
    tasksToday: 47,
    shipsAtSea: 18,
    shipsInPort: 6,
    certificatesExpiringSoon: 8,
    overdueMaintenances: 3
  }

  const mockShips: Ship[] = [
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
        lastUpdate: new Date()
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
    {
      id: "2", 
      name: "MV Pacific Explorer",
      imo: "IMO9345678",
      flag: "Marshall Islands",
      type: "bulk_carrier",
      status: "in_port",
      location: {
        lat: 35.6762,
        lng: 139.6503,
        port: "Tokyo",
        lastUpdate: new Date()
      },
      specifications: {
        length: 280,
        beam: 45,
        draft: 13.2,
        deadweight: 75000,
        grossTonnage: 82000,
        yearBuilt: 2020
      },
      crew: [],
      certificates: [],
      inventory: [],
      requisitions: [],
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "3",
      name: "MV Arctic Voyager",
      imo: "IMO9456789",
      flag: "Norway",
      type: "tanker",
      status: "anchored",
      location: {
        lat: 51.5074,
        lng: -0.1278,
        port: "London",
        lastUpdate: new Date()
      },
      specifications: {
        length: 320,
        beam: 55,
        draft: 16.8,
        deadweight: 95000,
        grossTonnage: 105000,
        yearBuilt: 2017
      },
      crew: [],
      certificates: [],
      inventory: [],
      requisitions: [],
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const handleShipSelect = (ship: Ship) => {
    setSelectedShip(ship)
    if (ship.location) {
      mapRef.current?.flyToLocation(ship.location.lat, ship.location.lng, 50000, 0)
      mapRef.current?.viewLocation(ship.location.port || `${ship.location.lat}, ${ship.location.lng}`)
    }
  }

  const handleAddShip = () => {
    setShowAddShipDialog(true)
  }

  const handleManageShip = (ship: Ship) => {
    router.push(`/ships/${ship.id}`)
  }

  const handleGlobalView = () => {
    mapRef.current?.flyToLocation(0, 0, 20000000, 0)
  }

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={dashboardStats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* World Map */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Global Fleet Map</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGlobalView}
                  >
                    Reset View
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[430px]">
                <EarthMap3D
                  ref={mapRef}
                  initialCenter={{ lat: 0, lng: 0, altitude: 0 }}
                  initialHeading={0}
                  initialTilt={45}
                  initialRange={20000000}
                  style={{ height: "100%", width: "100%" }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Alerts Panel */}
          <div>
            <AlertsWidget />
          </div>
        </div>

        {/* Ship Cards */}
        <ShipCards 
          ships={mockShips}
          onAddShip={handleAddShip}
          onShipSelect={handleShipSelect}
          onManageShip={handleManageShip}
        />

        {/* Add Ship Dialog */}
        <Dialog open={showAddShipDialog} onOpenChange={setShowAddShipDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Ship</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="ship-name"
                  placeholder="MV Ship Name"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-imo" className="text-right">
                  IMO
                </Label>
                <Input
                  id="ship-imo"
                  placeholder="IMO1234567"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select ship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="container">Container</SelectItem>
                    <SelectItem value="bulk_carrier">Bulk Carrier</SelectItem>
                    <SelectItem value="tanker">Tanker</SelectItem>
                    <SelectItem value="cargo">Cargo</SelectItem>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="offshore">Offshore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-flag" className="text-right">
                  Flag
                </Label>
                <Input
                  id="ship-flag"
                  placeholder="Panama"
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddShipDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddShipDialog(false)}>
                Add Ship
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
