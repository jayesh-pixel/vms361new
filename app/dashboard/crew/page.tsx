"use client"
import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, Upload, Calendar, Ship, Mail, Phone, Lock } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import type { CrewMember } from "@/lib/types"

export default function CrewPage() {
  const { canManageCrew, isViewer } = usePermissions()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [rankFilter, setRankFilter] = useState("all")

  // Mock crew data
  const crewMembers: CrewMember[] = [
    {
      id: "1",
      name: "Captain John Smith",
      rank: "Captain",
      nationality: "British",
      documents: [],
      joinDate: new Date("2023-01-15"),
      contractEnd: new Date("2024-12-31"),
      shipId: "1",
      status: "active",
      contact: {
        email: "j.smith@shipping.com",
        phone: "+44-555-0123",
        emergencyContact: "+44-555-0456"
      },
      certifications: [],
      schedule: []
    },
    {
      id: "2",
      name: "Chief Engineer Maria Rodriguez",
      rank: "Chief Engineer",
      nationality: "Spanish",
      documents: [],
      joinDate: new Date("2023-03-20"),
      contractEnd: new Date("2024-09-30"),
      shipId: "1",
      status: "active",
      contact: {
        email: "m.rodriguez@shipping.com",
        phone: "+34-555-0789",
        emergencyContact: "+34-555-0012"
      },
      certifications: [],
      schedule: []
    },
    {
      id: "3",
      name: "First Officer David Chen",
      rank: "First Officer",
      nationality: "Canadian",
      documents: [],
      joinDate: new Date("2023-06-10"),
      contractEnd: new Date("2024-06-09"),
      shipId: "2",
      status: "on_leave",
      contact: {
        email: "d.chen@shipping.com",
        phone: "+1-555-0345",
        emergencyContact: "+1-555-0678"
      },
      certifications: [],
      schedule: []
    }
  ]

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

  const getDaysUntilContractEnd = (contractEnd: Date) => {
    const today = new Date()
    const diffTime = contractEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredCrew = crewMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.nationality.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    const matchesRank = rankFilter === "all" || member.rank === rankFilter
    
    return matchesSearch && matchesStatus && matchesRank
  })

  return (
    <DashboardLayout currentPage="crew">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crew Management</h1>
            <p className="text-slate-600 mt-1">Manage personnel across your fleet</p>
          </div>
          <div className="flex gap-2">
            {canManageCrew() && (
              <>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Crew
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
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
                    {crewMembers.filter(c => getDaysUntilContractEnd(c.contractEnd) <= 30).length}
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
                const daysUntilContractEnd = getDaysUntilContractEnd(member.contractEnd)
                const contractExpiringSoon = daysUntilContractEnd <= 30 && daysUntilContractEnd > 0
                
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
                          {member.shipId && (
                            <>
                              <span>•</span>
                              <span>Ship ID: {member.shipId}</span>
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
                          Contract ends: {member.contractEnd.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {daysUntilContractEnd > 0 ? `${daysUntilContractEnd} days remaining` : 'Expired'}
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
      </div>
    </DashboardLayout>
  )
}
