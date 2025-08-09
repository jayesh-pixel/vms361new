"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useShips } from "@/hooks/use-ships"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Ship, Search, Filter, Plus, MoreHorizontal, MapPin, Users, Calendar, Settings, Upload, X } from "lucide-react"
import { toast } from "sonner"
import type { Ship as ShipType } from "@/lib/types/ships"

export default function ShipsPage() {
  const router = useRouter()
  const { ships, isLoading, error, setCurrentShip, createShip } = useShips()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // New ship form state
  const [newShip, setNewShip] = useState({
    name: "",
    imo: "",
    type: "",
    flag: "",
    yearBuilt: "",
    length: "",
    beam: "",
    draft: "",
    grossTonnage: "",
    deadweight: "",
    port: "",
    description: ""
  })
  const [shipImage, setShipImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter and search ships
  const filteredShips = useMemo(() => {
    let filtered = [...ships]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ship => 
        ship.name.toLowerCase().includes(query) ||
        ship.imo.toLowerCase().includes(query) ||
        ship.flag.toLowerCase().includes(query) ||
        ship.location?.port?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ship => ship.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(ship => ship.type === typeFilter)
    }

    return filtered
  }, [ships, searchQuery, statusFilter, typeFilter])

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
    setCurrentShip(ship)
    router.push(`/dashboard/ships/${ship.id}`)
  }

  const handleAddShip = () => {
    setShowAddDialog(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB")
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file")
        return
      }
      setShipImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setShipImage(null)
    setImagePreview(null)
  }

  const resetForm = () => {
    setNewShip({
      name: "",
      imo: "",
      type: "",
      flag: "",
      yearBuilt: "",
      length: "",
      beam: "",
      draft: "",
      grossTonnage: "",
      deadweight: "",
      port: "",
      description: ""
    })
    setShipImage(null)
    setImagePreview(null)
  }

  const handleSubmitShip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShip.name.trim() || !newShip.imo.trim() || !newShip.type) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const shipData = {
        name: newShip.name.trim(),
        imo: newShip.imo.trim(),
        type: newShip.type as any,
        flag: newShip.flag.trim() || "Unknown",
        status: "in_port" as const,
        specifications: {
          length: parseFloat(newShip.length) || 0,
          beam: parseFloat(newShip.beam) || 0,
          draft: parseFloat(newShip.draft) || 0,
          grossTonnage: parseFloat(newShip.grossTonnage) || 0,
          deadweight: parseFloat(newShip.deadweight) || 0,
          yearBuilt: parseInt(newShip.yearBuilt) || new Date().getFullYear()
        },
        location: {
          lat: 0,
          lng: 0,
          port: newShip.port.trim() || "Unknown Port",
          country: "",
          lastUpdate: new Date()
        },
        description: newShip.description.trim(),
        image: shipImage
      }

      await createShip(shipData)
      toast.success("Ship added successfully!")
      setShowAddDialog(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to add ship")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout currentPage="ships">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="ships">
      <div className="p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fleet Management</h1>
            <p className="text-slate-600 mt-1">Manage and monitor your entire fleet</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            onClick={handleAddShip}
          >
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
                  placeholder="Search ships by name, IMO, flag, or port..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
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
          </CardContent>
        </Card>

        {/* Ships Grid */}
        {filteredShips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-gray-500">
                  <Ship className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {ships.length === 0 ? "No ships yet" : "No ships match your search"}
                  </h3>
                  <p className="text-gray-500">
                    {ships.length === 0 
                      ? "Get started by adding your first ship to the fleet"
                      : "Try adjusting your search criteria or filters"
                    }
                  </p>
                </div>
                {ships.length === 0 && (
                  <Button onClick={handleAddShip}>Add Your First Ship</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredShips.map((ship) => (
              <Card key={ship.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {ship.name}
                      </CardTitle>
                      <p className="text-sm text-slate-600">{ship.imo}</p>
                    </div>
                    <Badge className={getStatusColor(ship.status)}>
                      {getStatusText(ship.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                {/* Ship Image */}
                {ship.imageUrl && (
                  <div className="px-6">
                    <img 
                      src={ship.imageUrl} 
                      alt={ship.name} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <CardContent className="space-y-4">
                  {/* Ship Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Ship className="h-4 w-4" />
                      <span>{ship.type.replace('_', ' ')} • {ship.flag}</span>
                    </div>
                    {ship.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{ship.location.port || 'Unknown Port'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>{ship.crew.length} crew members</span>
                    </div>
                  </div>

                  {/* Ship Specifications */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>Length: {ship.specifications.length}m</div>
                    <div>Beam: {ship.specifications.beam}m</div>
                    <div>DWT: {ship.specifications.deadweight.toLocaleString()}t</div>
                    <div>Built: {ship.specifications.yearBuilt}</div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{ship.tasks.length}</div>
                      <div className="text-xs text-slate-500">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{ship.requisitions.length}</div>
                      <div className="text-xs text-slate-500">Requisitions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{ship.certificates.length}</div>
                      <div className="text-xs text-slate-500">Certificates</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleManageShip(ship)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        toast.info(`Viewing details for ${ship.name}`)
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredShips.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">
                Showing {filteredShips.length} of {ships.length} ships
                {searchQuery && ` matching "${searchQuery}"`}
                {statusFilter !== "all" && ` with status "${getStatusText(statusFilter)}"`}
                {typeFilter !== "all" && ` of type "${typeFilter.replace('_', ' ')}"`}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Ship Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Ship</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitShip} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Ship Image (Optional)</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Ship preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Click to upload ship image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ship Name *</Label>
                  <Input
                    id="name"
                    required
                    value={newShip.name}
                    onChange={(e) => setNewShip(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter ship name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imo">IMO Number *</Label>
                  <Input
                    id="imo"
                    required
                    value={newShip.imo}
                    onChange={(e) => setNewShip(prev => ({...prev, imo: e.target.value}))}
                    placeholder="IMO1234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Ship Type *</Label>
                  <Select value={newShip.type} onValueChange={(value) => setNewShip(prev => ({...prev, type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ship type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="container">Container</SelectItem>
                      <SelectItem value="bulk_carrier">Bulk Carrier</SelectItem>
                      <SelectItem value="tanker">Tanker</SelectItem>
                      <SelectItem value="cargo">General Cargo</SelectItem>
                      <SelectItem value="passenger">Passenger</SelectItem>
                      <SelectItem value="offshore">Offshore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flag">Flag</Label>
                  <Input
                    id="flag"
                    value={newShip.flag}
                    onChange={(e) => setNewShip(prev => ({...prev, flag: e.target.value}))}
                    placeholder="Country of registration"
                  />
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="font-medium mb-3">Specifications</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (m)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={newShip.length}
                      onChange={(e) => setNewShip(prev => ({...prev, length: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beam">Beam (m)</Label>
                    <Input
                      id="beam"
                      type="number"
                      value={newShip.beam}
                      onChange={(e) => setNewShip(prev => ({...prev, beam: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft">Draft (m)</Label>
                    <Input
                      id="draft"
                      type="number"
                      value={newShip.draft}
                      onChange={(e) => setNewShip(prev => ({...prev, draft: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="grossTonnage">Gross Tonnage</Label>
                    <Input
                      id="grossTonnage"
                      type="number"
                      value={newShip.grossTonnage}
                      onChange={(e) => setNewShip(prev => ({...prev, grossTonnage: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadweight">Deadweight (t)</Label>
                    <Input
                      id="deadweight"
                      type="number"
                      value={newShip.deadweight}
                      onChange={(e) => setNewShip(prev => ({...prev, deadweight: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={newShip.yearBuilt}
                      onChange={(e) => setNewShip(prev => ({...prev, yearBuilt: e.target.value}))}
                      placeholder={new Date().getFullYear().toString()}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="port">Current Port</Label>
                <Input
                  id="port"
                  value={newShip.port}
                  onChange={(e) => setNewShip(prev => ({...prev, port: e.target.value}))}
                  placeholder="Port name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newShip.description}
                  onChange={(e) => setNewShip(prev => ({...prev, description: e.target.value}))}
                  placeholder="Additional ship details..."
                  rows={3}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {isSubmitting ? "Adding..." : "Add Ship"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
