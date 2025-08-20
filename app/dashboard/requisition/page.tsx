"use client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ShoppingCart,
  Wrench,
  Users,
  BarChart3,
  FileCheck,
  Scale,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  CalendarIcon,
  Package,
  DollarSign,
  TrendingUp,
  Building,
  ImageIcon,
  FileIcon,
  X
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useRequisitions } from "@/hooks/use-requisitions"
import { useAuth } from "@/hooks/use-auth"
import { ExtendedRequisition, RequisitionType } from "@/lib/types/requisition"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Form schemas
const requisitionSchema = z.object({
  // Basic Information
  reqsnNumber: z.string().optional(), // Will be auto-generated
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  department: z.string().min(1, "Department is required"),
  catalogue: z.enum(["Miscellaneous", "Engine Spares", "Deck Equipment", "Safety Equipment", "Navigation Equipment", "Other"]),
  model: z.string().optional(),
  type: z.enum(["Piece-Meal", "Bulk Order", "Emergency", "Regular"]),
  
  // Dates
  dateSent: z.date().optional(),
  deliveryDate: z.date(),
  requiredDate: z.date(),
  deliveryPort: z.string().min(1, "Delivery port is required"),
  
  // Status
  currentStatus: z.enum(["New Requisition", "Under Review", "Approved", "Ordered", "Shipped", "Delivered", "Rejected"]),
  
  // Vessel Requisition Details
  vesselRemarks: z.string().optional(),
  createdDate: z.date().optional(),
  
  // Questions
  maintenanceType: z.enum(["Regular Maintenance", "Breakdown"]),
  sparesChecked: z.enum(["Yes", "No"]),
  machineryEquipment: z.string().optional(),
  
  // Legacy fields for compatibility
  priority: z.enum(["low", "medium", "high", "urgent"]),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
    estimatedPrice: z.number().min(0, "Price must be positive").optional()
  })).min(1, "At least one item is required"),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(["image", "pdf", "document"]),
    size: z.number()
  })).optional()
})

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  category: z.enum(["marine_equipment", "engineering", "safety", "navigation", "catering", "cleaning", "spare_parts", "fuel", "lubricants", "services", "other"]),
  contact: z.object({
    primaryContact: z.string().min(1, "Primary contact is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required")
  }),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string().min(1, "Postal code is required")
  })
})

export default function RequisitionPage() {
  const { user } = useAuth()
  const { canCreateRequisition, canApproveRequisition, canManageVendors, userPermissions } = usePermissions()
  const { 
    requisitions, 
    vendors, 
    purchaseOrders, 
    workOrders, 
    auditReports,
    legalDocuments,
    stats,
    loading,
    error,
    createRequisition,
    updateRequisition,
    createVendor,
    loadRequisitions,
    loadVendors
  } = useRequisitions()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCreateRequisitionDialog, setShowCreateRequisitionDialog] = useState(false)
  const [showCreateVendorDialog, setShowCreateVendorDialog] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileUploadError, setFileUploadError] = useState<string>("")

  const requisitionForm = useForm<z.infer<typeof requisitionSchema>>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      reqsnNumber: "",
      title: "",
      description: "",
      department: "",
      catalogue: "Miscellaneous",
      model: "",
      type: "Piece-Meal",
      dateSent: new Date(),
      deliveryDate: new Date(),
      requiredDate: new Date(),
      deliveryPort: "",
      currentStatus: "New Requisition",
      vesselRemarks: "",
      createdDate: new Date(),
      maintenanceType: "Regular Maintenance",
      sparesChecked: "No",
      machineryEquipment: "",
      priority: "medium",
      items: [{ name: "", description: "", quantity: 1, unit: "", estimatedPrice: 0 }],
      attachments: []
    }
  })

  const vendorForm = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      category: "other",
      contact: {
        primaryContact: "",
        email: "",
        phone: ""
      },
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: ""
      }
    }
  })

  // Load data on component mount
  useEffect(() => {
    console.log("Component mounted, loading data...")
    console.log("User:", user)
    console.log("User permissions:", userPermissions)
    console.log("Company ID:", userPermissions?.companyId)
    console.log("Can create requisition:", canCreateRequisition())
    console.log("Can manage vendors:", canManageVendors())
    console.log("Vendors count:", vendors.length)
    console.log("Requisitions count:", requisitions.length)
    
    loadRequisitions()
    loadVendors()
  }, [userPermissions])

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    files.forEach(file => {
      // Check file type
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.startsWith('application/') ||
                         file.type.startsWith('text/')
      
      // Check file size
      const isValidSize = file.size <= maxSize
      
      if (!isValidType) {
        setFileUploadError(`File "${file.name}" is not a supported file type. Please upload images, PDFs, or documents.`)
        return
      }
      
      if (!isValidSize) {
        setFileUploadError(`File "${file.name}" is too large. Maximum size is 10MB.`)
        return
      }
      
      validFiles.push(file)
    })
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      setFileUploadError("")
      
      // Update form with file information
      const newAttachments = validFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for preview
        type: file.type.startsWith('image/') ? 'image' as const : 
              file.type === 'application/pdf' ? 'pdf' as const : 'document' as const,
        size: file.size
      }))
      
      const currentAttachments = requisitionForm.getValues('attachments') || []
      requisitionForm.setValue('attachments', [...currentAttachments, ...newAttachments])
    }
  }
  
  const removeFile = (index: number) => {
    const currentFiles = [...uploadedFiles]
    const currentAttachments = requisitionForm.getValues('attachments') || []
    
    // Remove file from state
    currentFiles.splice(index, 1)
    setUploadedFiles(currentFiles)
    
    // Remove attachment from form
    const newAttachments = [...currentAttachments]
    newAttachments.splice(index, 1)
    requisitionForm.setValue('attachments', newAttachments)
  }
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    } else if (fileType === 'application/pdf') {
      return <FileIcon className="h-4 w-4 text-red-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleCreateRequisition = async (data: z.infer<typeof requisitionSchema>) => {
    try {
      console.log("Creating requisition with data:", data)
      console.log("User:", user)
      console.log("Can create requisition:", canCreateRequisition())
      
      // Generate requisition number
      const currentDate = new Date()
      const year = currentDate.getFullYear().toString().substr(-2)
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const reqNumber = `TROY-SOT-V${year}${month}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      
      const reqId = await createRequisition({
        // Basic Information
        reqsnNumber: reqNumber,
        title: data.title,
        description: data.description,
        department: data.department,
        catalogue: data.catalogue,
        model: data.model,
        // Store original type in a custom field and use legacy type for compatibility
        requisitionType: data.type, // Store the new type value
        type: 'purchase' as RequisitionType, // Use compatible type for system
        
        // Dates
        dateSent: data.dateSent,
        deliveryDate: data.deliveryDate,
        requiredDate: data.requiredDate,
        deliveryPort: data.deliveryPort,
        
        // Status
        currentStatus: data.currentStatus,
        
        // Vessel Requisition Details
        vesselRemarks: data.vesselRemarks,
        createdDate: data.createdDate || new Date(),
        
        // Questions
        maintenanceType: data.maintenanceType,
        sparesChecked: data.sparesChecked,
        machineryEquipment: data.machineryEquipment,
        
        // Legacy compatibility fields
        priority: data.priority,
        items: data.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          itemNumber: `${index + 1}`,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.estimatedPrice || 0,
          totalPrice: (item.estimatedPrice || 0) * item.quantity,
          alternateVendors: [],
          urgencyLevel: data.priority === "urgent" ? "urgent" : "standard",
          approved: false
        })),
        status: "pending",
        approvalWorkflow: [],
        totalCost: data.items.reduce((sum, item) => sum + ((item.estimatedPrice || 0) * item.quantity), 0),
        currency: "USD",
        suggestedVendors: [],
        quotes: [],
        attachments: data.attachments?.map(att => att.url) || [],
        requestDate: new Date(),
        requestedBy: user?.uid || "system",
        companyId: userPermissions?.companyId || "default"
      })
      
      console.log("Requisition created with ID:", reqId)
      
      // Reload requisitions to update the UI
      await loadRequisitions()
      
      toast.success(`Requisition created successfully with number: ${reqNumber}`)
      setShowCreateRequisitionDialog(false)
      requisitionForm.reset()
      setUploadedFiles([])
      setFileUploadError("")
    } catch (error: any) {
      console.error("Failed to create requisition:", error)
      toast.error("Failed to create requisition: " + error.message)
    }
  }

  const handleCreateVendor = async (data: z.infer<typeof vendorSchema>) => {
    try {
      console.log("Creating vendor with data:", data)
      console.log("User:", user)
      console.log("Permissions available:", canManageVendors())
      
      const vendorId = await createVendor({
        name: data.name,
        category: data.category,
        status: "pending_approval",
        contact: {
          ...data.contact,
          alternatePhone: "",
          fax: "",
          website: ""
        },
        address: data.address,
        business: {
          registrationNumber: "",
          taxId: "",
          vatNumber: "",
          bankAccount: "",
          bankName: "",
          swiftCode: ""
        },
        certifications: [],
        capabilities: [],
        servicesOffered: [],
        rating: 0,
        creditLimit: 0,
        paymentTerms: "Net 30",
        currency: "USD",
        complianceDocuments: [],
        companyId: userPermissions?.companyId || "default",
        createdBy: user?.uid || "system"
      })
      
      console.log("Vendor created with ID:", vendorId)
      
      // Reload vendors to update the UI
      await loadVendors()
      
      toast.success("Vendor created successfully")
      setShowCreateVendorDialog(false)
      vendorForm.reset()
    } catch (error: any) {
      console.error("Failed to create vendor:", error)
      toast.error("Failed to create vendor: " + error.message)
    }
  }

  // Action handlers for requisitions
  const handleViewRequisition = (requisition: any) => {
    setSelectedRequisition(requisition)
    setShowViewDialog(true)
  }

  const handleEditRequisition = (requisition: any) => {
    setSelectedRequisition(requisition)
    
    // Reset file uploads
    setUploadedFiles([])
    setFileUploadError("")
    
    // Pre-populate the form with existing data
    requisitionForm.reset({
      // Basic Information
      reqsnNumber: requisition.reqsnNumber || requisition.prNumber,
      title: requisition.title,
      description: requisition.description,
      department: requisition.department,
      catalogue: requisition.catalogue || "Miscellaneous",
      model: requisition.model || "",
      type: requisition.type,
      
      // Dates
      dateSent: requisition.dateSent ? new Date(requisition.dateSent) : new Date(),
      deliveryDate: requisition.deliveryDate ? new Date(requisition.deliveryDate) : new Date(requisition.requiredDate),
      requiredDate: new Date(requisition.requiredDate),
      deliveryPort: requisition.deliveryPort || "",
      
      // Status
      currentStatus: requisition.currentStatus || requisition.status || "New Requisition",
      
      // Vessel Requisition Details
      vesselRemarks: requisition.vesselRemarks || "",
      createdDate: requisition.createdDate ? new Date(requisition.createdDate) : new Date(),
      
      // Questions
      maintenanceType: requisition.maintenanceType || "Regular Maintenance",
      sparesChecked: requisition.sparesChecked || "No",
      machineryEquipment: requisition.machineryEquipment || "",
      
      // Legacy fields
      priority: requisition.priority,
      items: requisition.items.map((item: any) => ({
        name: item.name,
        description: item.description || "",
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.unitPrice || 0
      })),
      attachments: requisition.attachments ? requisition.attachments.map((url: string) => ({
        name: url.split('/').pop() || 'attachment',
        url: url,
        type: url.toLowerCase().includes('.pdf') ? 'pdf' as const : 
              url.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'image' as const : 
              'document' as const,
        size: 0
      })) : []
    })
    setShowEditDialog(true)
  }

  const handleApproveRequisition = async (requisitionId: string) => {
    try {
      console.log("Starting approval process for requisition:", requisitionId)
      
      // Find the current requisition
      const currentReq = requisitions.find(req => req.id === requisitionId)
      console.log("Current requisition status:", currentReq?.status)
      
      // Show loading state
      toast.loading("Approving requisition...")
      
      // Update the status
      await updateRequisition(requisitionId, { status: "approved" })
      console.log("Update requisition call completed")
      
      // Dismiss loading and show success
      toast.dismiss()
      toast.success("Requisition approved successfully")
      
      // Force reload requisitions to ensure UI is updated
      console.log("Forcing reload of requisitions...")
      await loadRequisitions()
      console.log("Requisitions reloaded, new count:", requisitions.length)
      
      // Verify the status change
      const updatedReq = requisitions.find(req => req.id === requisitionId)
      console.log("Updated requisition status:", updatedReq?.status)
      
    } catch (error: any) {
      console.error("Failed to approve requisition:", error)
      toast.dismiss()
      toast.error("Failed to approve requisition: " + error.message)
    }
  }

  const handleUpdateRequisition = async (data: z.infer<typeof requisitionSchema>) => {
    try {
      if (!selectedRequisition) return
      
      console.log("Updating requisition:", selectedRequisition.id, "with data:", data)
      
      await updateRequisition(selectedRequisition.id, {
        title: data.title,
        description: data.description,
        // Legacy compatibility fields - map new types to old system
        type: 'purchase' as RequisitionType,
        department: data.department,
        priority: data.priority,
        requiredDate: data.requiredDate,
        items: data.items.map((item, index) => ({
          id: selectedRequisition.items[index]?.id || `item-${Date.now()}-${index}`,
          itemNumber: `${index + 1}`,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.estimatedPrice || 0,
          totalPrice: (item.estimatedPrice || 0) * item.quantity,
          preferredVendor: selectedRequisition.items[index]?.preferredVendor,
          alternateVendors: selectedRequisition.items[index]?.alternateVendors || [],
          urgencyLevel: data.priority === "urgent" ? "urgent" : "standard",
          approved: selectedRequisition.items[index]?.approved || false
        })),
        totalCost: data.items.reduce((sum, item) => sum + ((item.estimatedPrice || 0) * item.quantity), 0),
        attachments: data.attachments?.map(att => att.url) || []
      })
      
      toast.success("Requisition updated successfully")
      setShowEditDialog(false)
      setUploadedFiles([])
      setFileUploadError("")
      await loadRequisitions()
    } catch (error: any) {
      console.error("Failed to update requisition:", error)
      toast.error("Failed to update requisition: " + error.message)
    }
  }

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = (req.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.prNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    const matchesType = typeFilter === "all" || req.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      ordered: "secondary",
      delivered: "default"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "secondary",
      high: "default",
      urgent: "destructive"
    }
    return <Badge variant={variants[priority] || "outline"}>{priority}</Badge>
  }

  return (
    <DashboardLayout currentPage="requisition">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Requisition & Procurement Management</h1>
            <p className="text-slate-600 mt-1">Comprehensive material and service management system</p>
          </div>
          <div className="flex gap-2">
            {canCreateRequisition() && (
              <Dialog open={showCreateRequisitionDialog} onOpenChange={setShowCreateRequisitionDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Requisition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Requisition</DialogTitle>
                    <DialogDescription>
                      Create a new material or service requisition
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...requisitionForm}>
                    <form onSubmit={requisitionForm.handleSubmit(handleCreateRequisition)} className="space-y-4">
                      {/* Basic Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={requisitionForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Requisition Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., MAC Main Switch" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Engine Spares">Engine Spares</SelectItem>
                                    <SelectItem value="Deck Spares">Deck Spares</SelectItem>
                                    <SelectItem value="Other Spares">Other Spares</SelectItem>
                                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                                    <SelectItem value="Navigation Equipment">Navigation Equipment</SelectItem>
                                    <SelectItem value="Catering">Catering</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={requisitionForm.control}
                            name="catalogue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Catalogue</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select catalogue" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                    <SelectItem value="Engine Spares">Engine Spares</SelectItem>
                                    <SelectItem value="Deck Equipment">Deck Equipment</SelectItem>
                                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                                    <SelectItem value="Navigation Equipment">Navigation Equipment</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Diesel Doctor D" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={requisitionForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Requisition Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Piece-Meal">Piece-Meal</SelectItem>
                                    <SelectItem value="Bulk Order">Bulk Order</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="deliveryPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Port</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Itaqui" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <FormField
                        control={requisitionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dates Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Important Dates</h3>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={requisitionForm.control}
                            name="dateSent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date Sent</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const dateValue = e.target.value;
                                      if (dateValue) {
                                        field.onChange(new Date(dateValue));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="deliveryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const dateValue = e.target.value;
                                      if (dateValue) {
                                        field.onChange(new Date(dateValue));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="requiredDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Required Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const dateValue = e.target.value;
                                      if (dateValue) {
                                        field.onChange(new Date(dateValue));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Status Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Status Information</h3>
                        
                        <FormField
                          control={requisitionForm.control}
                          name="currentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="New Requisition">New Requisition</SelectItem>
                                  <SelectItem value="Under Review">Under Review</SelectItem>
                                  <SelectItem value="Approved">Approved</SelectItem>
                                  <SelectItem value="Ordered">Ordered</SelectItem>
                                  <SelectItem value="Shipped">Shipped</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Vessel Requisition Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Vessel Requisition Details</h3>
                        
                        <FormField
                          control={requisitionForm.control}
                          name="vesselRemarks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vessel Requisition Remarks</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Free-text remarks box (example: Created date: 08/Jan/2025)" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={requisitionForm.control}
                            name="maintenanceType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Is this requisition related to regular maintenance or breakdown?</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Regular Maintenance">Regular Maintenance</SelectItem>
                                    <SelectItem value="Breakdown">Breakdown</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requisitionForm.control}
                            name="sparesChecked"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Have you checked spares onboard and updated ROB?</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select answer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={requisitionForm.control}
                          name="machineryEquipment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related to machinery/equipment?</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter machinery/equipment details" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Items</label>
                        {requisitionForm.watch("items").map((_, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                            <FormField
                              control={requisitionForm.control}
                              name={`items.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Item name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={requisitionForm.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Qty" 
                                      {...field} 
                                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={requisitionForm.control}
                              name={`items.${index}.unit`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Unit" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={requisitionForm.control}
                              name={`items.${index}.estimatedPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      placeholder="Price" 
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentItems = requisitionForm.getValues("items")
                                if (currentItems.length > 1) {
                                  requisitionForm.setValue("items", currentItems.filter((_, i) => i !== index))
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentItems = requisitionForm.getValues("items")
                            requisitionForm.setValue("items", [
                              ...currentItems,
                              { name: "", description: "", quantity: 1, unit: "", estimatedPrice: 0 }
                            ])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Attachments (Images, PDFs, Documents)</label>
                        
                        {/* File Upload Input */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            id="file-upload"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium text-blue-600 hover:text-blue-500">
                                Click to upload
                              </span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              Images, PDFs, Documents (Max 10MB each)
                            </p>
                          </label>
                        </div>

                        {/* Error Message */}
                        {fileUploadError && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {fileUploadError}
                          </div>
                        )}

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase">Uploaded Files</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {getFileIcon(file.type)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateRequisitionDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Requisition</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            {canManageVendors() && (
              <Dialog open={showCreateVendorDialog} onOpenChange={setShowCreateVendorDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Building className="h-4 w-4 mr-2" />
                    New Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Add New Vendor</DialogTitle>
                    <DialogDescription>
                      Add a new vendor to your procurement network
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...vendorForm}>
                    <form onSubmit={vendorForm.handleSubmit(handleCreateVendor)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={vendorForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Company name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={vendorForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="marine_equipment">Marine Equipment</SelectItem>
                                  <SelectItem value="engineering">Engineering</SelectItem>
                                  <SelectItem value="safety">Safety</SelectItem>
                                  <SelectItem value="navigation">Navigation</SelectItem>
                                  <SelectItem value="catering">Catering</SelectItem>
                                  <SelectItem value="cleaning">Cleaning</SelectItem>
                                  <SelectItem value="spare_parts">Spare Parts</SelectItem>
                                  <SelectItem value="fuel">Fuel</SelectItem>
                                  <SelectItem value="lubricants">Lubricants</SelectItem>
                                  <SelectItem value="services">Services</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contact Information</label>
                        <div className="grid grid-cols-1 gap-2">
                          <FormField
                            control={vendorForm.control}
                            name="contact.primaryContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Primary contact person" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={vendorForm.control}
                              name="contact.email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Email address" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={vendorForm.control}
                              name="contact.phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Phone number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Address</label>
                        <div className="space-y-2">
                          <FormField
                            control={vendorForm.control}
                            name="address.street"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Street address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={vendorForm.control}
                              name="address.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={vendorForm.control}
                              name="address.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="State/Province" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={vendorForm.control}
                              name="address.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Country" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={vendorForm.control}
                              name="address.postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Postal code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateVendorDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Vendor</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.requisition?.pendingApproval || 0}</p>
                  <p className="text-sm text-slate-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.requisition?.approved || 0}</p>
                  <p className="text-sm text-slate-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{purchaseOrders.length}</p>
                  <p className="text-sm text-slate-600">Purchase Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{workOrders.length}</p>
                  <p className="text-sm text-slate-600">Work Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{vendors.length}</p>
                  <p className="text-sm text-slate-600">Active Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.requisition?.urgent || 0}</p>
                  <p className="text-sm text-slate-600">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requisitions" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
            <TabsTrigger value="audit-reports">Audit Reports</TabsTrigger>
            <TabsTrigger value="legal">Legal Documents</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="requisitions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Material & Service Requisitions</CardTitle>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search requisitions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reqsn Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Catalogue</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Delivery Port</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequisitions.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.reqsnNumber || req.prNumber}</TableCell>
                        <TableCell>{req.title}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>{req.catalogue || 'N/A'}</TableCell>
                        <TableCell>{req.model || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{req.requisitionType || req.type}</TableCell>
                        <TableCell>{getStatusBadge(req.currentStatus || req.status)}</TableCell>
                        <TableCell>{req.deliveryDate ? format(new Date(req.deliveryDate), "MMM dd, yyyy") : format(new Date(req.requiredDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{req.deliveryPort || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewRequisition(req)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRequisition(req)}
                              title="Edit Requisition"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canApproveRequisition() && req.status === "pending" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleApproveRequisition(req.id)}
                                title="Approve Requisition"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Purchase Order Management</h3>
                  <p className="text-slate-600">Track and manage purchase orders from requisitions to delivery.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Work Order Management</h3>
                  <p className="text-slate-600">Schedule and track maintenance, repair, and service work orders.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
              </CardHeader>
              <CardContent>
                
                {vendors.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.vendorId}</TableCell>
                          <TableCell>{vendor.name}</TableCell>
                          <TableCell className="capitalize">{vendor.category.replace('_', ' ')}</TableCell>
                          <TableCell>{vendor.contact.email}</TableCell>
                          <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {vendor.rating > 0 && (
                                <span className="text-yellow-500">
                                  {'★'.repeat(Math.floor(vendor.rating))}
                                </span>
                              )}
                              <span className="ml-1 text-sm text-gray-600">
                                {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'No rating'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Vendors Yet</h3>
                    <p className="text-slate-600">Start by adding vendors to your procurement network.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit-reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Audit Report Management</h3>
                  <p className="text-slate-600">Track internal and external audits, findings, and corrective actions.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Legal Documents & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Scale className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Legal Document Management</h3>
                  <p className="text-slate-600">Manage contracts, agreements, licenses, and compliance documents.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Procurement Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Procurement Value</span>
                      <span className="font-bold">${stats.requisition?.totalValue.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Average Processing Time</span>
                      <span className="font-bold">{stats.requisition?.averageProcessingTime || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Vendors</span>
                      <span className="font-bold">{vendors.filter(v => v.status === 'active').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span>New Requisitions Today</span>
                        <span className="font-medium text-blue-600">
                          {requisitions.filter(r => 
                            new Date(r.createdAt).toDateString() === new Date().toDateString()
                          ).length}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span>Pending Approvals</span>
                        <span className="font-medium text-yellow-600">
                          {stats.requisition?.pendingApproval || 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span>Urgent Requisitions</span>
                        <span className="font-medium text-red-600">
                          {stats.requisition?.urgent || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Requisition Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Requisition Details</DialogTitle>
              <DialogDescription>
                View complete requisition information
              </DialogDescription>
            </DialogHeader>
            {selectedRequisition && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Requisition Number</label>
                      <p className="text-lg font-semibold">{selectedRequisition.reqsnNumber || selectedRequisition.prNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-lg font-semibold">{selectedRequisition.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p>{selectedRequisition.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Catalogue</label>
                      <p>{selectedRequisition.catalogue || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Model</label>
                      <p>{selectedRequisition.model || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Requisition Type</label>
                      <p className="capitalize">{selectedRequisition.requisitionType || selectedRequisition.type}</p>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Important Dates</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date Sent</label>
                      <p>{selectedRequisition.dateSent ? format(new Date(selectedRequisition.dateSent), "PPP") : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Delivery Date</label>
                      <p>{selectedRequisition.deliveryDate ? format(new Date(selectedRequisition.deliveryDate), "PPP") : format(new Date(selectedRequisition.requiredDate), "PPP")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Required Date</label>
                      <p>{format(new Date(selectedRequisition.requiredDate), "PPP")}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Port</label>
                    <p>{selectedRequisition.deliveryPort || 'N/A'}</p>
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Current Status Section</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRequisition.currentStatus || selectedRequisition.status)}</div>
                  </div>
                </div>

                {/* Vessel Requisition Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Vessel Requisition Remarks</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Remarks</label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedRequisition.vesselRemarks || 'No remarks provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p>{selectedRequisition.createdDate ? format(new Date(selectedRequisition.createdDate), "PPP") : 'N/A'}</p>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Questions</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Is this requisition related to regular maintenance or breakdown?</label>
                      <p className="mt-1 font-semibold text-blue-600">{selectedRequisition.maintenanceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Have you checked spares onboard and updated ROB?</label>
                      <p className="mt-1 font-semibold text-green-600">{selectedRequisition.sparesChecked || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Related to machinery/equipment?</label>
                      <p className="mt-1">{selectedRequisition.machineryEquipment || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedRequisition.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Items (Count: {selectedRequisition.items?.length || 0})</label>
                  <div className="mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequisition.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-500">{item.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>${item.totalPrice.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Attachments Section */}
                {selectedRequisition.attachments && selectedRequisition.attachments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Attachments</label>
                    <div className="mt-2 grid grid-cols-1 gap-3">
                      {selectedRequisition.attachments.map((attachment: string, index: number) => {
                        const fileName = attachment.split('/').pop() || `attachment-${index + 1}`
                        const fileType = attachment.toLowerCase().includes('.pdf') ? 'application/pdf' : 
                                        attachment.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'image' : 
                                        'document'
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                            <div className="flex items-center gap-3">
                              {getFileIcon(fileType)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {fileType === 'application/pdf' ? 'PDF Document' : 
                                   fileType === 'image' ? 'Image File' : 
                                   'Document'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {fileType === 'image' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(attachment, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = attachment
                                  link.download = fileName
                                  link.click()
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Requisition Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Requisition</DialogTitle>
              <DialogDescription>
                Update requisition information
              </DialogDescription>
            </DialogHeader>
            <Form {...requisitionForm}>
              <form onSubmit={requisitionForm.handleSubmit(handleUpdateRequisition)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={requisitionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Requisition title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requisitionForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="material">Material Requisition</SelectItem>
                            <SelectItem value="service">Service Requisition</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={requisitionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={requisitionForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Department" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requisitionForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requisitionForm.control}
                    name="requiredDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Required Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Items</label>
                  {requisitionForm.watch("items").map((_, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                      <FormField
                        control={requisitionForm.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={requisitionForm.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Qty" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={requisitionForm.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Unit" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={requisitionForm.control}
                        name={`items.${index}.estimatedPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="Price" 
                                {...field} 
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentItems = requisitionForm.getValues("items")
                          if (currentItems.length > 1) {
                            requisitionForm.setValue("items", currentItems.filter((_, i) => i !== index))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentItems = requisitionForm.getValues("items")
                      requisitionForm.setValue("items", [
                        ...currentItems,
                        { name: "", description: "", quantity: 1, unit: "", estimatedPrice: 0 }
                      ])
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {/* File Upload Section for Edit */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Attachments (Images, PDFs, Documents)</label>
                  
                  {/* File Upload Input */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload-edit"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload-edit" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Images, PDFs, Documents (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Error Message */}
                  {fileUploadError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {fileUploadError}
                    </div>
                  )}

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Uploaded Files</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Requisition</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
