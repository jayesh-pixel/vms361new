"use client"
import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useShips } from "@/hooks/use-ships"
import { usePermissions } from "@/hooks/use-permissions"
import { CrewService } from "@/lib/services/crew-service"
import EarthMap3D, { type EarthMap3DRef } from "@/components/react-earth-map-3d"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { StatsCards, AlertsWidget } from "@/components/dashboard/stats-cards"
import { ShipCards } from "@/components/dashboard/ship-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Calendar, FileText, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Ship, CreateShipRequest, ShipType, CrewMember } from "@/lib/types/ships"
import type { DashboardStats } from "@/lib/types"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { ships, stats, isLoading: shipsLoading, createShip, error, canCreateShip } = useShips()
  const { userPermissions, isOwner, isAdmin, isViewer } = usePermissions()
  const mapRef = useRef<EarthMap3DRef>(null)
  const router = useRouter()
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
  const [showAddShipDialog, setShowAddShipDialog] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [crewLoading, setCrewLoading] = useState(true)
  const [newShipForm, setNewShipForm] = useState<CreateShipRequest>({
    name: '',
    imo: '',
    flag: '',
    type: 'container',
    status: 'in_port',
    location: {
      lat: 0,
      lng: 0,
      port: '',
      lastUpdate: new Date()
    },
    specifications: {
      length: 0,
      beam: 0,
      draft: 0,
      deadweight: 0,
      grossTonnage: 0,
      yearBuilt: new Date().getFullYear()
    }
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !hasRedirected) {
      setHasRedirected(true)
      router.replace('/auth/login')
    }
  }, [user, loading, router, hasRedirected])

  // Load crew data
  useEffect(() => {
    loadCrewData()
  }, [userPermissions])

  const loadCrewData = async () => {
    if (!userPermissions?.companyId) return
    
    setCrewLoading(true)
    try {
      if (isAdmin()) {
        const allCrew = await CrewService.getAllCrew()
        setCrewMembers(allCrew)
      } else {
        const companyCrew = await CrewService.getCrewByCompany(userPermissions.companyId)
        setCrewMembers(companyCrew)
      }
    } catch (error: any) {
      console.error('Error loading crew data:', error)
      toast.error('Failed to load crew data')
    } finally {
      setCrewLoading(false)
    }
  }

  if (loading || shipsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Convert ShipStats to DashboardStats with crew data
  const activeCrew = crewMembers.filter(crew => crew.status === 'active').length
  const dashboardStats: DashboardStats = stats ? {
    totalShips: stats.totalShips,
    activeCrew: activeCrew,
    pendingRequisitions: stats.pendingRequisitions,
    tasksToday: stats.activeTasks,
    shipsAtSea: stats.byStatus.at_sea || 0,
    shipsInPort: stats.byStatus.in_port || 0,
    certificatesExpiringSoon: stats.expiringCertificates,
    overdueMaintenances: 0 // Not available in ShipStats, would need separate calculation
  } : {
    totalShips: 0,
    activeCrew: activeCrew,
    pendingRequisitions: 0,
    tasksToday: 0,
    shipsAtSea: 0,
    shipsInPort: 0,
    certificatesExpiringSoon: 0,
    overdueMaintenances: 0
  }

  const handleShipSelect = (ship: Ship) => {
    setSelectedShip(ship)
    if (ship.location) {
      mapRef.current?.flyToLocation(ship.location.lat, ship.location.lng, 50000, 0)
      mapRef.current?.viewLocation(ship.location.port || `${ship.location.lat}, ${ship.location.lng}`)
    }
  }

  const handleAddShip = () => {
    router.push(`/dashboard/ships/`)
  }

  const handleManageShip = (ship: Ship) => {
    router.push(`/dashboard/ships/${ship.id}`)
  }

  const handleGlobalView = () => {
    mapRef.current?.flyToLocation(0, 0, 20000000, 0)
  }

  const handleCreateShip = async () => {
    if (!newShipForm.name || !newShipForm.imo || !newShipForm.flag) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      await createShip(newShipForm)
      toast.success('Ship created successfully')
      setShowAddShipDialog(false)
      setNewShipForm({
        name: '',
        imo: '',
        flag: '',
        type: 'container',
        status: 'in_port',
        location: {
          lat: 0,
          lng: 0,
          port: '',
          lastUpdate: new Date()
        },
        specifications: {
          length: 0,
          beam: 0,
          draft: 0,
          deadweight: 0,
          grossTonnage: 0,
          yearBuilt: new Date().getFullYear()
        }
      })
      // Redirect to ships page after successful creation
      router.push('/dashboard/ships')
    } catch (err: any) {
      console.error('Error creating ship:', err)
      toast.error(err.message || 'Failed to create ship')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Fleet Overview</h2>
            <Button onClick={handleAddShip}>Add Ship</Button>
          </div>
          
          {ships.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No ships yet</h3>
                    <p className="text-gray-500">Get started by adding your first ship to the fleet</p>
                  </div>
                  <Button onClick={handleAddShip}>Add Your First Ship</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ships.map((ship) => (
                <Card key={ship.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{ship.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ship.status === 'at_sea' ? 'bg-blue-100 text-blue-800' :
                          ship.status === 'in_port' ? 'bg-green-100 text-green-800' :
                          ship.status === 'anchored' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ship.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{ship.imo}</p>
                      <p className="text-sm text-gray-600">{ship.type.replace('_', ' ')} • {ship.flag}</p>
                      {ship.location && (
                        <p className="text-sm text-gray-600">📍 {ship.location.port}</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShipSelect(ship)}
                        >
                          View on Map
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleManageShip(ship)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Crew Overview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Crew Overview</h2>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/crew')}
            >
              View All Crew
            </Button>
          </div>
          
          {crewLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading crew data...</p>
              </CardContent>
            </Card>
          ) : crewMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No crew members yet</h3>
                    <p className="text-gray-500">Add crew members to your ships to see them here</p>
                  </div>
                  <Button onClick={() => router.push('/dashboard/crew')}>
                    Manage Crew
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {crewMembers.slice(0, 8).map((crew) => {
                const ship = ships.find(s => s.id === crew.shipId);
                return (
                  <Card key={crew.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{crew.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            crew.status === 'active' ? 'bg-green-100 text-green-800' :
                            crew.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {crew.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{crew.rank}</p>
                        <p className="text-xs text-gray-600">🏴 {crew.nationality}</p>
                        {ship && (
                          <p className="text-xs text-gray-600">🚢 {ship.name}</p>
                        )}
                        {crew.salary && (
                          <p className="text-xs text-gray-600">
                            💰 {crew.currency} {crew.salary.toLocaleString()}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          Joined: {crew.joinDate.toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
          
          {crewMembers.length > 8 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/crew')}
              >
                View {crewMembers.length - 8} More Crew Members
              </Button>
            </div>
          )}
        </div>

        {/* Add Ship Dialog */}
        <Dialog open={showAddShipDialog} onOpenChange={setShowAddShipDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Ship</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="ship-name"
                  placeholder="MV Ship Name"
                  className="col-span-3"
                  value={newShipForm.name}
                  onChange={(e) => setNewShipForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-imo" className="text-right">
                  IMO *
                </Label>
                <Input
                  id="ship-imo"
                  placeholder="IMO1234567"
                  className="col-span-3"
                  value={newShipForm.imo}
                  onChange={(e) => setNewShipForm(prev => ({ ...prev, imo: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-flag" className="text-right">
                  Flag *
                </Label>
                <Input
                  id="ship-flag"
                  placeholder="Panama"
                  className="col-span-3"
                  value={newShipForm.flag}
                  onChange={(e) => setNewShipForm(prev => ({ ...prev, flag: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newShipForm.type}
                  onValueChange={(value: ShipType) => setNewShipForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="container">Container</SelectItem>
                    <SelectItem value="bulk_carrier">Bulk Carrier</SelectItem>
                    <SelectItem value="tanker">Tanker</SelectItem>
                    <SelectItem value="cargo">General Cargo</SelectItem>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="offshore">Offshore</SelectItem>
                    <SelectItem value="fishing">Fishing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ship-port" className="text-right">
                  Current Port
                </Label>
                <Input
                  id="ship-port"
                  placeholder="Port Name"
                  className="col-span-3"
                  value={newShipForm.location.port}
                  onChange={(e) => setNewShipForm(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, port: e.target.value }
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="ship-length" className="text-right text-sm">
                    Length (m)
                  </Label>
                  <Input
                    id="ship-length"
                    type="number"
                    placeholder="300"
                    value={newShipForm.specifications.length || ''}
                    onChange={(e) => setNewShipForm(prev => ({ 
                      ...prev, 
                      specifications: { ...prev.specifications, length: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="ship-beam" className="text-right text-sm">
                    Beam (m)
                  </Label>
                  <Input
                    id="ship-beam"
                    type="number"
                    placeholder="48"
                    value={newShipForm.specifications.beam || ''}
                    onChange={(e) => setNewShipForm(prev => ({ 
                      ...prev, 
                      specifications: { ...prev.specifications, beam: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="ship-dwt" className="text-right text-sm">
                    DWT (tons)
                  </Label>
                  <Input
                    id="ship-dwt"
                    type="number"
                    placeholder="85000"
                    value={newShipForm.specifications.deadweight || ''}
                    onChange={(e) => setNewShipForm(prev => ({ 
                      ...prev, 
                      specifications: { ...prev.specifications, deadweight: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="ship-year" className="text-right text-sm">
                    Year Built
                  </Label>
                  <Input
                    id="ship-year"
                    type="number"
                    placeholder="2020"
                    value={newShipForm.specifications.yearBuilt || ''}
                    onChange={(e) => setNewShipForm(prev => ({ 
                      ...prev, 
                      specifications: { ...prev.specifications, yearBuilt: parseInt(e.target.value) || new Date().getFullYear() }
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddShipDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateShip}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Ship'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
