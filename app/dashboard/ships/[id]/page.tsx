"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useShips } from "@/hooks/use-ships"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/hooks/use-auth"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Ship, 
  MapPin, 
  Users, 
  FileText, 
  Package, 
  ClipboardList, 
  CheckSquare,
  Calendar,
  Phone,
  Mail,
  Settings,
  Edit,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Lock,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import type { Ship as ShipType, CrewMember, Certificate, InventoryItem, Requisition, Task } from "@/lib/types/ships"
import type { Job, CreateJobRequest } from "@/lib/types/jobs"
import { JobService } from "@/lib/services/job-service"

export default function ShipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const shipId = params.id as string
  
  const { 
    ships, 
    currentShip, 
    setCurrentShip, 
    isLoading, 
    error,
    getShipCrew,
    getShipCertificates,
    getShipInventory,
    getShipRequisitions,
    getShipTasks,
    addCrewMember,
    addCertificate,
    addInventoryItem,
    createRequisition,
    createTask,
    canUpdateShip,
    canDeleteShip,
    canManageCrew,
    canManageInventory,
    canCreateRequisition,
    canCreateTask
  } = useShips()
  
  const { isViewer } = usePermissions()
  const { user } = useAuth()
  
  // Get user permissions for company reference
  const { userPermissions } = usePermissions()

  // Local state
  const [activeTab, setActiveTab] = useState("overview")
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Dialog states
  const [showAddCrewDialog, setShowAddCrewDialog] = useState(false)
  const [showAddCertDialog, setShowAddCertDialog] = useState(false)
  const [showAddInventoryDialog, setShowAddInventoryDialog] = useState(false)
  const [showAddRequisitionDialog, setShowAddRequisitionDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showPostJobDialog, setShowPostJobDialog] = useState(false)

  // Form states
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
    jobType: ""
  })

  const [newCertificate, setNewCertificate] = useState({
    name: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    certificateNumber: ""
  })

  const [newInventoryItem, setNewInventoryItem] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    location: "",
    description: ""
  })

  const [newRequisition, setNewRequisition] = useState({
    title: "",
    description: "",
    type: "material" as "material" | "service",
    priority: "medium" as "low" | "medium" | "high",
    requiredDate: "",
    estimatedCost: ""
  })

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    estimatedHours: ""
  })

  const [newJob, setNewJob] = useState({
    title: "",
    subtitle: "",
    position: "",
    category: "",
    jobType: "Permanent Job",
    company: "",
    companyId: "",
    imageUrl: "",
    rating: "",
    jobDescription: "",
    location: "",
    salaryMin: 400,
    salaryMax: 5000,
    currency: "USD",
    education: [] as string[],
    function: [] as string[],
    industry: [] as string[],
    role: [] as string[],
    skills: [] as string[]
  })

  const [customFields, setCustomFields] = useState<{[key: string]: string}>({})
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string[]}>({
    education: [],
    function: [],
    industry: [],
    role: [],
    skills: [],
    category: []
  })
  const [availableOptions, setAvailableOptions] = useState<{[key: string]: string[]}>(JobService.getDefaultOptions())
  const [postedJobs, setPostedJobs] = useState<Job[]>([])

  // Find current ship
  useEffect(() => {
    const ship = ships.find(s => s.id === shipId)
    if (ship) {
      setCurrentShip(ship)
      loadShipData(shipId)
    }
  }, [ships, shipId, setCurrentShip])

  const loadShipData = async (id: string) => {
    setLoadingData(true)
    try {
      const [crewData, certData, invData, reqData, taskData, jobsData] = await Promise.all([
        getShipCrew(id),
        getShipCertificates(id),
        getShipInventory(id),
        getShipRequisitions(id),
        getShipTasks(id),
        JobService.getJobsByShip(id)
      ])
      
      setCrew(crewData)
      setCertificates(certData)
      setInventory(invData)
      setRequisitions(reqData)
      setTasks(taskData)
      setPostedJobs(jobsData)
    } catch (error: any) {
      toast.error("Failed to load ship data: " + error.message)
    } finally {
      setLoadingData(false)
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddCrewMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCrewMember.name || !newCrewMember.rank || !newCrewMember.jobType) {
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

      await addCrewMember(shipId, crewData)
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
        jobType: ""
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to add crew member: " + error.message)
    }
  }

  // Job posting handlers
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJob.title || !newJob.position || !newJob.jobDescription || selectedOptions.category.length === 0) {
      toast.error("Please fill in all required fields including category")
      return
    }

    try {
      const jobData: CreateJobRequest = {
        title: newJob.title,
        subtitle: newJob.subtitle,
        position: newJob.position,
        category: selectedOptions.category.length > 0 ? selectedOptions.category[0] : "General", // Take first selected category
        jobType: newJob.jobType as any,
        company: newJob.company,
        companyId: userPermissions?.companyId || "",
        imageUrl: newJob.imageUrl,
        rating: newJob.rating,
        jobDescription: newJob.jobDescription,
        location: newJob.location,
        salaryMin: newJob.salaryMin,
        salaryMax: newJob.salaryMax,
        currency: newJob.currency,
        education: selectedOptions.education,
        function: selectedOptions.function,
        industry: selectedOptions.industry,
        role: selectedOptions.role,
        skills: selectedOptions.skills,
        shipId: shipId,
        createdBy: user?.uid || "",
        status: 'active'
      }

      await JobService.createJob(jobData)
      toast.success("Job posted successfully!")
      setShowPostJobDialog(false)
      resetJobForm()
      // Reload ship data to refresh jobs list
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to post job: " + error.message)
    }
  }

  const resetJobForm = () => {
    setNewJob({
      title: "",
      subtitle: "",
      position: "",
      category: "",
      jobType: "Permanent Job",
      company: "",
      companyId: "",
      imageUrl: "",
      rating: "",
      jobDescription: "",
      location: "",
      salaryMin: 400,
      salaryMax: 5000,
      currency: "USD",
      education: [],
      function: [],
      industry: [],
      role: [],
      skills: []
    })
    setSelectedOptions({
      education: [],
      function: [],
      industry: [],
      role: [],
      skills: [],
      category: []
    })
    setCustomFields({})
  }

  const handleOptionToggle = (fieldName: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(option) 
        ? prev[fieldName].filter(item => item !== option)
        : [...prev[fieldName], option]
    }))
  }

  const handleAddCustomField = async (fieldName: string) => {
    const newFieldValue = customFields[fieldName]
    if (!newFieldValue || !newFieldValue.trim()) {
      toast.error("Please enter a valid field value")
      return
    }

    try {
      // Add to dynamic fields collection
      await JobService.createDynamicField({
        fieldName,
        fieldValue: newFieldValue.trim(),
        createdBy: user?.uid || ""
      })

      // Add to available options temporarily (will be permanent after admin approval)
      setAvailableOptions(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], newFieldValue.trim()]
      }))

      // Select the newly added option
      setSelectedOptions(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], newFieldValue.trim()]
      }))

      // Clear the custom field input
      setCustomFields(prev => ({
        ...prev,
        [fieldName]: ""
      }))

      toast.success("Custom field added! It will be available for all users after admin approval.")
    } catch (error: any) {
      toast.error("Failed to add custom field: " + error.message)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCertificate.name || !newCertificate.expiryDate) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const certData = {
        name: newCertificate.name,
        type: "Ship Certificate",
        issuingAuthority: newCertificate.issuingAuthority || "Unknown Authority",
        issueDate: new Date(newCertificate.issueDate || Date.now()),
        expiryDate: new Date(newCertificate.expiryDate),
        certificateNumber: newCertificate.certificateNumber || "N/A",
        reminderDays: 30
      }

      await addCertificate(shipId, certData)
      toast.success("Certificate added successfully")
      setShowAddCertDialog(false)
      setNewCertificate({
        name: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        certificateNumber: ""
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to add certificate: " + error.message)
    }
  }

  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInventoryItem.name || !newInventoryItem.quantity) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const itemData = {
        partNumber: `P${Date.now()}`,
        name: newInventoryItem.name,
        description: newInventoryItem.description,
        category: newInventoryItem.category || "General",
        currentStock: parseInt(newInventoryItem.quantity),
        minimumStock: Math.ceil(parseInt(newInventoryItem.quantity) * 0.2),
        unit: newInventoryItem.unit || "pcs",
        location: newInventoryItem.location || "Storage",
        lastStockUpdate: new Date()
      }

      await addInventoryItem(shipId, itemData)
      toast.success("Inventory item added successfully")
      setShowAddInventoryDialog(false)
      setNewInventoryItem({
        name: "",
        category: "",
        quantity: "",
        unit: "",
        location: "",
        description: ""
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to add inventory item: " + error.message)
    }
  }

  const handleAddRequisition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequisition.title || !newRequisition.requiredDate) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const reqData = {
        type: newRequisition.type,
        requestedBy: "current-user", // This should be actual user ID
        requestDate: new Date(),
        requiredDate: new Date(newRequisition.requiredDate),
        status: "pending" as const,
        priority: newRequisition.priority as 'low' | 'medium' | 'high' | 'urgent',
        items: [{
          id: `item-${Date.now()}`,
          name: newRequisition.title,
          description: newRequisition.description,
          quantity: 1,
          unit: "pcs",
          estimatedPrice: parseFloat(newRequisition.estimatedCost) || 0
        }],
        notes: newRequisition.description,
        totalCost: parseFloat(newRequisition.estimatedCost) || 0
      }

      await createRequisition(shipId, reqData)
      toast.success("Requisition created successfully")
      setShowAddRequisitionDialog(false)
      setNewRequisition({
        title: "",
        description: "",
        type: "material",
        priority: "medium",
        requiredDate: "",
        estimatedCost: ""
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to create requisition: " + error.message)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title || !newTask.dueDate) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assignedTo: newTask.assignedTo || "Unassigned",
        assignedBy: "current-user", // This should be actual user ID
        dueDate: new Date(newTask.dueDate),
        priority: newTask.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: "pending" as const,
        category: "General",
        estimatedHours: parseFloat(newTask.estimatedHours) || 0
      }

      await createTask(shipId, taskData)
      toast.success("Task created successfully")
      setShowAddTaskDialog(false)
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
        estimatedHours: ""
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to create task: " + error.message)
    }
  }

  if (isLoading || loadingData) {
    return (
      <DashboardLayout currentPage="ships">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentShip) {
    return (
      <DashboardLayout currentPage="ships">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Ship className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Ship Not Found</h3>
            <p className="text-gray-600 mt-2">The requested ship could not be found.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/ships')}>
              Back to Ships
            </Button>
          </div>
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
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/ships')}
            >
              ← Back to Ships
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{currentShip.name}</h1>
              <p className="text-slate-600">IMO: {currentShip.imo} • {currentShip.flag}</p>
            </div>
          </div>
          <Badge className={getStatusColor(currentShip.status)}>
            {getStatusText(currentShip.status)}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{crew.length}</p>
                  <p className="text-xs text-gray-600">Crew Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{certificates.length}</p>
                  <p className="text-xs text-gray-600">Certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                  <p className="text-xs text-gray-600">Inventory Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{requisitions.length}</p>
                  <p className="text-xs text-gray-600">Requisitions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  <p className="text-xs text-gray-600">Active Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ship Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Ship Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-medium">{currentShip.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Flag</p>
                      <p className="font-medium">{currentShip.flag}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">IMO</p>
                      <p className="font-medium">{currentShip.imo}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <Badge className={getStatusColor(currentShip.status)}>
                        {getStatusText(currentShip.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Length</p>
                      <p className="font-medium">{currentShip.specifications.length}m</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Beam</p>
                      <p className="font-medium">{currentShip.specifications.beam}m</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Draft</p>
                      <p className="font-medium">{currentShip.specifications.draft}m</p>
                    </div>
                    <div>
                      <p className="text-gray-600">DWT</p>
                      <p className="font-medium">{currentShip.specifications.deadweight.toLocaleString()}t</p>
                    </div>
                    <div>
                      <p className="text-gray-600">GT</p>
                      <p className="font-medium">{currentShip.specifications.grossTonnage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Built</p>
                      <p className="font-medium">{currentShip.specifications.yearBuilt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{currentShip.location?.port || "Unknown Port"}</p>
                      <p className="text-sm text-gray-600">{currentShip.location?.country || "Unknown Country"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Crew Tab */}
          <TabsContent value="crew" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Crew Members</h3>
              <div className="flex gap-2">
                <Button onClick={() => setShowPostJobDialog(true)} variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
                <Button onClick={() => setShowAddCrewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Crew Member
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {crew.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.rank} • {member.nationality}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {member.contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{member.contact.email}</span>
                            </div>
                          )}
                          {member.contact.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{member.contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {member.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {crew.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Crew Members</h4>
                    <p className="text-gray-600 mb-4">Add crew members to manage your ship's personnel.</p>
                    <Button onClick={() => setShowAddCrewDialog(true)}>Add First Crew Member</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Posted Jobs Section */}
            {postedJobs.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Posted Jobs ({postedJobs.length})</h4>
                <div className="grid gap-4">
                  {postedJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-lg">{job.title}</h5>
                            <p className="text-sm text-gray-600 mb-2">{job.position} • {job.category}</p>
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.jobDescription}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
                              <div>📍 {job.location}</div>
                              <div>💰 {job.salaryMin}-{job.salaryMax} {job.currency}</div>
                              <div>👥 {job.role.join(', ')}</div>
                              <div>🎓 {job.education.join(', ')}</div>
                            </div>

                            {job.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {job.skills.slice(0, 5).map(skill => (
                                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {job.skills.length > 5 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    +{job.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <Badge className="bg-green-100 text-green-800 mb-2">
                              {job.status}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Job ID: {job.jobId}
                            </p>
                            <p className="text-xs text-gray-500">
                              Posted: {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Certificates</h3>
              <Button onClick={() => setShowAddCertDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Certificate
              </Button>
            </div>

            <div className="grid gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-sm text-gray-600">{cert.issuingAuthority}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={cert.status === 'valid' ? 'bg-green-100 text-green-800' : 
                                     cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}>
                        {cert.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {certificates.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Certificates</h4>
                    <p className="text-gray-600 mb-4">Add certificates to track your ship's compliance.</p>
                    <Button onClick={() => setShowAddCertDialog(true)}>Add First Certificate</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Inventory</h3>
              <Button onClick={() => setShowAddInventoryDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="grid gap-4">
              {inventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category} • {item.location}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.currentStock} {item.unit}</p>
                        {item.currentStock <= item.minimumStock && (
                          <Badge className="bg-red-100 text-red-800 mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {inventory.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Inventory Items</h4>
                    <p className="text-gray-600 mb-4">Add inventory items to track ship supplies.</p>
                    <Button onClick={() => setShowAddInventoryDialog(true)}>Add First Item</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Requisitions Tab */}
          <TabsContent value="requisitions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Requisitions</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/ships/${shipId}/requisitions`)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Manage Ship Requisitions
                </Button>
                <Button onClick={() => setShowAddRequisitionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Requisition
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {requisitions.slice(0, 3).map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{req.items[0]?.name || "Requisition Item"}</h4>
                        <p className="text-sm text-gray-600">{req.notes || "No description"}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getPriorityColor(req.priority)}>
                            {req.priority}
                          </Badge>
                          <Badge variant="outline">
                            {req.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Due: {new Date(req.requiredDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                        'bg-gray-100 text-gray-800'}>
                          {req.status}
                        </Badge>
                        {req.totalCost && req.totalCost > 0 && (
                          <p className="text-sm font-semibold mt-1">${req.totalCost.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {requisitions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Requisitions</h4>
                    <p className="text-gray-600 mb-4">Create requisitions to request materials or services for this ship.</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setShowAddRequisitionDialog(true)}>Quick Requisition</Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/ships/${shipId}/requisitions`)}
                      >
                        Manage Requisitions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : requisitions.length > 3 && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-gray-600 mb-3">
                      Showing {Math.min(3, requisitions.length)} of {requisitions.length} requisitions
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/ships/${shipId}/requisitions`)}
                    >
                      View All Requisitions
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Button onClick={() => setShowAddTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>

            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Assigned to: {task.assignedTo}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.estimatedHours && task.estimatedHours > 0 && (
                          <p className="text-sm text-gray-500 mt-1">{task.estimatedHours}h est.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Tasks</h4>
                    <p className="text-gray-600 mb-4">Create tasks to manage ship operations and maintenance.</p>
                    <Button onClick={() => setShowAddTaskDialog(true)}>Create First Task</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
                  required
                  value={newCrewMember.name}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-rank">Rank *</Label>
                <Input
                  id="crew-rank"
                  required
                  value={newCrewMember.rank}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, rank: e.target.value}))}
                />
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
                <Label htmlFor="crew-nationality">Nationality</Label>
                <Input
                  id="crew-nationality"
                  value={newCrewMember.nationality}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, nationality: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crew-join-date">Join Date</Label>
                <Input
                  id="crew-join-date"
                  type="date"
                  value={newCrewMember.joinDate}
                  onChange={(e) => setNewCrewMember(prev => ({...prev, joinDate: e.target.value}))}
                  placeholder="dd-mm-yyyy"
                />
              </div>
              {(newCrewMember.jobType === "Contract" || newCrewMember.jobType === "Internship") && (
                <div className="space-y-2">
                  <Label htmlFor="crew-contract-end">Contract End Date *</Label>
                  <Input
                    id="crew-contract-end"
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
                <Button type="submit">Add Crew Member</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Certificate Dialog */}
        <Dialog open={showAddCertDialog} onOpenChange={setShowAddCertDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCertificate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-name">Certificate Name *</Label>
                <Input
                  id="cert-name"
                  required
                  value={newCertificate.name}
                  onChange={(e) => setNewCertificate(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-authority">Issuing Authority</Label>
                <Input
                  id="cert-authority"
                  value={newCertificate.issuingAuthority}
                  onChange={(e) => setNewCertificate(prev => ({...prev, issuingAuthority: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-number">Certificate Number</Label>
                <Input
                  id="cert-number"
                  value={newCertificate.certificateNumber}
                  onChange={(e) => setNewCertificate(prev => ({...prev, certificateNumber: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cert-issue-date">Issue Date</Label>
                  <Input
                    id="cert-issue-date"
                    type="date"
                    value={newCertificate.issueDate}
                    onChange={(e) => setNewCertificate(prev => ({...prev, issueDate: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-expiry-date">Expiry Date *</Label>
                  <Input
                    id="cert-expiry-date"
                    type="date"
                    required
                    value={newCertificate.expiryDate}
                    onChange={(e) => setNewCertificate(prev => ({...prev, expiryDate: e.target.value}))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCertDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Certificate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Inventory Dialog */}
        <Dialog open={showAddInventoryDialog} onOpenChange={setShowAddInventoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddInventoryItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-name">Item Name *</Label>
                <Input
                  id="inv-name"
                  required
                  value={newInventoryItem.name}
                  onChange={(e) => setNewInventoryItem(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-category">Category</Label>
                <Select value={newInventoryItem.category} onValueChange={(value) => setNewInventoryItem(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                    <SelectItem value="Navigation">Navigation</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-quantity">Quantity *</Label>
                  <Input
                    id="inv-quantity"
                    type="number"
                    required
                    value={newInventoryItem.quantity}
                    onChange={(e) => setNewInventoryItem(prev => ({...prev, quantity: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-unit">Unit</Label>
                  <Input
                    id="inv-unit"
                    value={newInventoryItem.unit}
                    placeholder="pcs, kg, liters, etc."
                    onChange={(e) => setNewInventoryItem(prev => ({...prev, unit: e.target.value}))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-location">Location</Label>
                <Input
                  id="inv-location"
                  value={newInventoryItem.location}
                  placeholder="Storage location"
                  onChange={(e) => setNewInventoryItem(prev => ({...prev, location: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-description">Description</Label>
                <Textarea
                  id="inv-description"
                  value={newInventoryItem.description}
                  onChange={(e) => setNewInventoryItem(prev => ({...prev, description: e.target.value}))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddInventoryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Requisition Dialog */}
        <Dialog open={showAddRequisitionDialog} onOpenChange={setShowAddRequisitionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Requisition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRequisition} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="req-title">Title *</Label>
                <Input
                  id="req-title"
                  required
                  value={newRequisition.title}
                  onChange={(e) => setNewRequisition(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-description">Description</Label>
                <Textarea
                  id="req-description"
                  value={newRequisition.description}
                  onChange={(e) => setNewRequisition(prev => ({...prev, description: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="req-type">Type</Label>
                  <Select value={newRequisition.type} onValueChange={(value) => setNewRequisition(prev => ({...prev, type: value as "material" | "service"}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-priority">Priority</Label>
                  <Select value={newRequisition.priority} onValueChange={(value) => setNewRequisition(prev => ({...prev, priority: value as "low" | "medium" | "high"}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-date">Required Date *</Label>
                <Input
                  id="req-date"
                  type="date"
                  required
                  value={newRequisition.requiredDate}
                  onChange={(e) => setNewRequisition(prev => ({...prev, requiredDate: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-cost">Estimated Cost ($)</Label>
                <Input
                  id="req-cost"
                  type="number"
                  step="0.01"
                  value={newRequisition.estimatedCost}
                  onChange={(e) => setNewRequisition(prev => ({...prev, estimatedCost: e.target.value}))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddRequisitionDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Requisition</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({...prev, description: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned">Assigned To</Label>
                <Input
                  id="task-assigned"
                  value={newTask.assignedTo}
                  placeholder="Person or role"
                  onChange={(e) => setNewTask(prev => ({...prev, assignedTo: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({...prev, priority: value as "low" | "medium" | "high"}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-hours">Est. Hours</Label>
                  <Input
                    id="task-hours"
                    type="number"
                    step="0.5"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask(prev => ({...prev, estimatedHours: e.target.value}))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date *</Label>
                <Input
                  id="task-due"
                  type="date"
                  required
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({...prev, dueDate: e.target.value}))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddTaskDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Post Job Dialog */}
        <Dialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Job for {currentShip?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-6">
              {/* Basic Job Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title *</Label>
                  <Input
                    id="job-title"
                    required
                    value={newJob.title}
                    placeholder="e.g., Marine Engineer"
                    onChange={(e) => setNewJob(prev => ({...prev, title: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-position">Position *</Label>
                  <Input
                    id="job-position"
                    required
                    value={newJob.position}
                    placeholder="e.g., Second Officer"
                    onChange={(e) => setNewJob(prev => ({...prev, position: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-category">Category</Label>
                  <Select value={newJob.category} onValueChange={(value) => setNewJob(prev => ({...prev, category: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.category.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Job Type</Label>
                  <Select value={newJob.jobType} onValueChange={(value) => setNewJob(prev => ({...prev, jobType: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.jobType.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-company">Company Name</Label>
                  <Input
                    id="job-company"
                    value={newJob.company}
                    placeholder="Company name"
                    onChange={(e) => setNewJob(prev => ({...prev, company: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-location">Location</Label>
                  <Input
                    id="job-location"
                    value={newJob.location}
                    placeholder="e.g., Mumbai, Maharashtra"
                    onChange={(e) => setNewJob(prev => ({...prev, location: e.target.value}))}
                  />
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <Label className="text-base font-medium">Salary Range</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary-min">Minimum</Label>
                    <Input
                      id="salary-min"
                      type="number"
                      value={newJob.salaryMin}
                      onChange={(e) => setNewJob(prev => ({...prev, salaryMin: parseInt(e.target.value) || 0}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary-max">Maximum</Label>
                    <Input
                      id="salary-max"
                      type="number"
                      value={newJob.salaryMax}
                      onChange={(e) => setNewJob(prev => ({...prev, salaryMax: parseInt(e.target.value) || 0}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary-currency">Currency</Label>
                    <Select value={newJob.currency} onValueChange={(value) => setNewJob(prev => ({...prev, currency: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Multi-select fields with custom field addition */}
              {(['education', 'function', 'industry', 'role', 'skills'] as const).map(fieldName => (
                <div key={fieldName} className="space-y-2">
                  <Label className="text-base font-medium capitalize">{fieldName}</Label>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {availableOptions[fieldName].map(option => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedOptions[fieldName].includes(option)}
                            onChange={() => handleOptionToggle(fieldName, option)}
                            className="rounded"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Add custom ${fieldName}`}
                          value={customFields[fieldName] || ""}
                          onChange={(e) => setCustomFields(prev => ({
                            ...prev,
                            [fieldName]: e.target.value
                          }))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddCustomField(fieldName)}
                          disabled={!customFields[fieldName]?.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                  {selectedOptions[fieldName].length > 0 && (
                    <div className="text-xs text-green-600">
                      Selected: {selectedOptions[fieldName].join(', ')}
                    </div>
                  )}
                </div>
              ))}

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description *</Label>
                <Textarea
                  id="job-description"
                  required
                  rows={6}
                  value={newJob.jobDescription}
                  placeholder="Detailed job description, requirements, responsibilities..."
                  onChange={(e) => setNewJob(prev => ({...prev, jobDescription: e.target.value}))}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPostJobDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Post Job
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Post Job Dialog */}
        <Dialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Job for {currentShip?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-6">
              {/* Basic Job Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title *</Label>
                  <Input
                    id="job-title"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob(prev => ({...prev, title: e.target.value}))}
                    placeholder="e.g. Marine Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-position">Position *</Label>
                  <Input
                    id="job-position"
                    required
                    value={newJob.position}
                    onChange={(e) => setNewJob(prev => ({...prev, position: e.target.value}))}
                    placeholder="e.g. Second Officer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-subtitle">Subtitle</Label>
                  <Input
                    id="job-subtitle"
                    value={newJob.subtitle}
                    onChange={(e) => setNewJob(prev => ({...prev, subtitle: e.target.value}))}
                    placeholder="e.g. Proprietor Of Maritime Smart Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Job Type *</Label>
                  <Select value={newJob.jobType} onValueChange={(value) => setNewJob(prev => ({...prev, jobType: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.jobType.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category - Dynamic Field */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableOptions.category.map(cat => (
                      <div key={cat} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${cat}`}
                          checked={selectedOptions.category.includes(cat)}
                          onChange={() => handleOptionToggle('category', cat)}
                        />
                        <label htmlFor={`category-${cat}`} className="text-sm">{cat}</label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom category"
                      value={customFields.category || ''}
                      onChange={(e) => setCustomFields(prev => ({...prev, category: e.target.value}))}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => handleAddCustomField('category')}
                      disabled={!customFields.category?.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {selectedOptions.category.length > 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      Selected: {selectedOptions.category.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob(prev => ({...prev, company: e.target.value}))}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-rating">Company Rating</Label>
                  <Input
                    id="company-rating"
                    value={newJob.rating}
                    onChange={(e) => setNewJob(prev => ({...prev, rating: e.target.value}))}
                    placeholder="e.g. 4.6"
                  />
                </div>
              </div>

              {/* Location & Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-location">Location *</Label>
                  <Input
                    id="job-location"
                    required
                    value={newJob.location}
                    onChange={(e) => setNewJob(prev => ({...prev, location: e.target.value}))}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newJob.currency} onValueChange={(value) => setNewJob(prev => ({...prev, currency: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary-min">Minimum Salary *</Label>
                  <Input
                    id="salary-min"
                    type="number"
                    required
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob(prev => ({...prev, salaryMin: parseInt(e.target.value) || 0}))}
                    placeholder="400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary-max">Maximum Salary *</Label>
                  <Input
                    id="salary-max"
                    type="number"
                    required
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob(prev => ({...prev, salaryMax: parseInt(e.target.value) || 0}))}
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Dynamic Multi-select Fields */}
              {['education', 'function', 'industry', 'role', 'skills'].map(fieldName => (
                <div key={fieldName} className="space-y-2">
                  <Label className="capitalize">{fieldName} Requirements</Label>
                  <div className="p-4 border rounded-lg max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {availableOptions[fieldName]?.map((option: string) => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${fieldName}-${option}`}
                            checked={selectedOptions[fieldName].includes(option)}
                            onChange={() => handleOptionToggle(fieldName, option)}
                            className="rounded"
                          />
                          <label htmlFor={`${fieldName}-${option}`} className="text-sm">{option}</label>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder={`Add custom ${fieldName}`}
                        value={customFields[fieldName] || ''}
                        onChange={(e) => setCustomFields(prev => ({...prev, [fieldName]: e.target.value}))}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddCustomField(fieldName)}
                        disabled={!customFields[fieldName]?.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {selectedOptions[fieldName].length > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        Selected: {selectedOptions[fieldName].join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description *</Label>
                <Textarea
                  id="job-description"
                  required
                  rows={6}
                  value={newJob.jobDescription}
                  onChange={(e) => setNewJob(prev => ({...prev, jobDescription: e.target.value}))}
                  placeholder="Detailed job description..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPostJobDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Post Job
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
