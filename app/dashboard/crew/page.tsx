"use client"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Search, Plus, Upload, Calendar, Ship, Mail, Phone, Lock, Edit, Eye } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useShips } from "@/hooks/use-ships"
import { useAuth } from "@/hooks/use-auth"
import { CrewService } from "@/lib/services/crew-service"
import { toast } from "sonner"
import type { CrewMember } from "@/lib/types"

export default function CrewPage() {
  const { canManageCrew, isViewer, isAdmin, userPermissions } = usePermissions()
  const { ships, getShipCrew, addCrewMember } = useShips()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [rankFilter, setRankFilter] = useState("all")
  const [shipFilter, setShipFilter] = useState("all")
  
  // Dialog states
  const [showAddCrewDialog, setShowAddCrewDialog] = useState(false)
  const [allCrewMembers, setAllCrewMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state for new crew member
  const [newCrewMember, setNewCrewMember] = useState({
    name: "",
    rank: "",
    nationality: "",
    joinDate: "",
    contractEndDate: "",
    email: "",
    phone: "",
    emergencyContact: "",
    salary: "",
    currency: "USD",
    shipId: "",
    jobType: ""
  })

  // Load all crew members from all ships
  useEffect(() => {
    loadAllCrewMembers()
  }, [ships, userPermissions])

  const loadAllCrewMembers = async () => {
    setIsLoading(true)
    try {
      if (isAdmin()) {
        // Admin can see all crew members
        const allCrew = await CrewService.getAllCrew()
        // Get ship names for each crew member
        const crewWithShipNames = await Promise.all(
          allCrew.map(async (crew) => {
            const ship = ships.find(s => s.id === crew.shipId)
            return {
              ...crew,
              shipName: ship?.name || 'Unknown Ship',
              shipId: crew.shipId || ''
            }
          })
        )
        setAllCrewMembers(crewWithShipNames)
      } else if (userPermissions?.companyId) {
        // Regular users see only their company's crew
        const companyCrew = await CrewService.getCrewByCompany(userPermissions.companyId)
        const crewWithShipNames = await Promise.all(
          companyCrew.map(async (crew) => {
            const ship = ships.find(s => s.id === crew.shipId)
            return {
              ...crew,
              shipName: ship?.name || 'Unknown Ship',
              shipId: crew.shipId || ''
            }
          })
        )
        setAllCrewMembers(crewWithShipNames)
      }
    } catch (error: any) {
      toast.error("Failed to load crew data: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCrewMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCrewMember.name || !newCrewMember.rank || !newCrewMember.shipId || !newCrewMember.jobType) {
      toast.error("Please fill in required fields including job type")
      return
    }

    // Check if contract end date is required
    if ((newCrewMember.jobType === "Contract" || newCrewMember.jobType === "Internship") && !newCrewMember.contractEndDate) {
      toast.error("Contract end date is required for Contract and Internship job types")
      return
    }

    try {
      const crewData: any = {
        name: newCrewMember.name,
        rank: newCrewMember.rank,
        nationality: newCrewMember.nationality,
        joinDate: new Date(newCrewMember.joinDate || Date.now()),
        certificates: [],
        contact: {
          email: newCrewMember.email || "",
          phone: newCrewMember.phone || "",
          emergencyContact: newCrewMember.emergencyContact || ""
        },
        salary: parseFloat(newCrewMember.salary) || 0,
        currency: newCrewMember.currency,
        jobType: newCrewMember.jobType,
        status: "active" as const
      }

      // Only add contractEndDate if it has a value
      if (newCrewMember.contractEndDate) {
        crewData.contractEndDate = new Date(newCrewMember.contractEndDate)
      }

      await addCrewMember(newCrewMember.shipId, crewData)
      toast.success("Crew member added successfully")
      setShowAddCrewDialog(false)
      setNewCrewMember({
        name: "",
        rank: "",
        nationality: "",
        joinDate: "",
        contractEndDate: "",
        email: "",
        phone: "",
        emergencyContact: "",
        salary: "",
        currency: "USD",
        shipId: "",
        jobType: ""
      })
      // Reload crew data
      loadAllCrewMembers()
    } catch (error: any) {
      toast.error("Failed to add crew member: " + error.message)
    }
  }

  // Use real data for all users
  const crewMembers = allCrewMembers

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "on_leave":
        return "bg-yellow-100 text-yellow-800"
      case "standby":
        return "bg-blue-100 text-blue-800"
      case "medical":
        return "bg-orange-100 text-orange-800"
      case "terminated":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getDaysUntilContractEnd = (member: any) => {
    const contractEnd = member.contractEnd || member.contractEndDate
    if (!contractEnd) return 0
    
    const today = new Date()
    const endDate = new Date(contractEnd)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredCrew = crewMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (member.shipName && member.shipName.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    const matchesRank = rankFilter === "all" || member.rank === rankFilter
    const matchesShip = shipFilter === "all" || member.shipId === shipFilter
    
    return matchesSearch && matchesStatus && matchesRank && matchesShip
  })

  return (
    <DashboardLayout currentPage="crew">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crew Management</h1>
            <p className="text-slate-600 mt-1">
              Manage personnel across your entire fleet
            </p>
          </div>
          <div className="flex gap-2">
            {canManageCrew() && (
              <>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Crew
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  onClick={() => setShowAddCrewDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Crew Member
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {crewMembers.filter(c => c.status === 'active').length}
                  </p>
                  <p className="text-sm text-slate-600">Active Crew</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {crewMembers.filter(c => getDaysUntilContractEnd(c) <= 30).length}
                  </p>
                  <p className="text-sm text-slate-600">Contracts Ending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Ship className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Set(crewMembers.filter(c => c.shipId).map(c => c.shipId)).size}
                  </p>
                  <p className="text-sm text-slate-600">Ships Crewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {crewMembers.filter(c => c.status === 'standby').length}
                  </p>
                  <p className="text-sm text-slate-600">On Standby</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search crew by name, rank, or nationality..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranks</SelectItem>
                  <SelectItem value="Captain">Captain</SelectItem>
                  <SelectItem value="Chief Engineer">Chief Engineer</SelectItem>
                  <SelectItem value="First Officer">First Officer</SelectItem>
                  <SelectItem value="Second Officer">Second Officer</SelectItem>
                  <SelectItem value="Bosun">Bosun</SelectItem>
                  <SelectItem value="Able Seaman">Able Seaman</SelectItem>
                </SelectContent>
              </Select>
              <Select value={shipFilter} onValueChange={setShipFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by ship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ships</SelectItem>
                  {ships.map(ship => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Crew List */}
        <Card>
          <CardHeader>
            <CardTitle>Crew Members ({filteredCrew.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCrew.map((member) => {
                const daysUntilContractEnd = getDaysUntilContractEnd(member)
                const contractExpiringSoon = daysUntilContractEnd <= 30 && daysUntilContractEnd > 0
                const contractEnd = member.contractEnd || member.contractEndDate
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder-user.jpg`} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-slate-900">{member.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{member.rank}</span>
                          <span>•</span>
                          <span>{member.nationality}</span>
                          {member.shipName && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-blue-600">{member.shipName}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{member.contact.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.contact.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Contract ends: {contractEnd ? new Date(contractEnd).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {daysUntilContractEnd > 0 ? `${daysUntilContractEnd} days remaining` : contractEnd ? 'Expired' : 'No contract date'}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(member.status)}>
                          {getStatusText(member.status)}
                        </Badge>
                        {contractExpiringSoon && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Contract Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {filteredCrew.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No crew members found</h3>
                <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Crew Member Dialog */}
        <Dialog open={showAddCrewDialog} onOpenChange={setShowAddCrewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Crew Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCrewMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crew-name">Name *</Label>
                <Input
                  id="crew-name"
                  value={newCrewMember.name}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-rank">Rank *</Label>
                <Select value={newCrewMember.rank} onValueChange={(value) => setNewCrewMember(prev => ({...prev, rank: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="Chief Engineer">Chief Engineer</SelectItem>
                    <SelectItem value="First Officer">First Officer</SelectItem>
                    <SelectItem value="Second Officer">Second Officer</SelectItem>
                    <SelectItem value="Bosun">Bosun</SelectItem>
                    <SelectItem value="Able Seaman">Able Seaman</SelectItem>
                    <SelectItem value="Cook">Cook</SelectItem>
                    <SelectItem value="Mechanic">Mechanic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-jobType">Job Type *</Label>
                <Select value={newCrewMember.jobType} onValueChange={(value) => setNewCrewMember(prev => ({...prev, jobType: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-ship">Assign to Ship *</Label>
                <Select value={newCrewMember.shipId} onValueChange={(value) => setNewCrewMember(prev => ({...prev, shipId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ship" />
                  </SelectTrigger>
                  <SelectContent>
                    {ships.map(ship => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-nationality">Nationality</Label>
                <Input
                  id="crew-nationality"
                  value={newCrewMember.nationality}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, nationality: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-joinDate">Join Date</Label>
                <Input
                  id="crew-joinDate"
                  type="date"
                  value={newCrewMember.joinDate}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, joinDate: e.target.value}))}
                  placeholder="dd-mm-yyyy"
                />
              </div>
              {(newCrewMember.jobType === "Contract" || newCrewMember.jobType === "Internship") && (
                <div className="space-y-2">
                  <Label htmlFor="crew-contractEnd">Contract End Date *</Label>
                  <Input
                    id="crew-contractEnd"
                    type="date"
                    value={newCrewMember.contractEndDate}
                    onChange={(e) => setNewCrewMember(prev => ({...prev, contractEndDate: e.target.value}))}
                    placeholder="dd-mm-yyyy"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="crew-email">Email</Label>
                <Input
                  id="crew-email"
                  type="email"
                  value={newCrewMember.email}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, email: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-phone">Phone</Label>
                <Input
                  id="crew-phone"
                  value={newCrewMember.phone}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crew-salary">Salary</Label>
                  <Input
                    id="crew-salary"
                    type="number"
                    placeholder="Enter salary"
                    value={newCrewMember.salary}
                    onChange={(e) => setNewCrewMember(prev => ({...prev, salary: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crew-currency">Currency</Label>
                  <Select value={newCrewMember.currency} onValueChange={(value) => setNewCrewMember(prev => ({...prev, currency: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCrewDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Crew Member"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      )}
    </DashboardLayout>
  )
}
