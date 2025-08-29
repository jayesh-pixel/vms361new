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
  Upload,
  X,
  File,
  Image as ImageIcon,
  PenTool
} from "lucide-react"
import { toast } from "sonner"
import type { Ship as ShipType, CrewMember, Certificate, Drawing, InventoryItem, Requisition, Task } from "@/lib/types/ships"
import { storageService } from "@/lib/storage-service"

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
    getShipDrawings,
    getShipInventory,
    getShipRequisitions,
    getShipTasks,
    addCrewMember,
    addCertificate,
    addDrawing,
    updateDrawing,
    deleteDrawing,
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
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Dialog states
  const [showAddCrewDialog, setShowAddCrewDialog] = useState(false)
  const [showAddCertDialog, setShowAddCertDialog] = useState(false)
  const [showAddDrawingDialog, setShowAddDrawingDialog] = useState(false)
  const [showEditDrawingDialog, setShowEditDrawingDialog] = useState(false)
  const [showViewDrawingDialog, setShowViewDrawingDialog] = useState(false)
  const [showDeleteDrawingDialog, setShowDeleteDrawingDialog] = useState(false)
  const [showAddInventoryDialog, setShowAddInventoryDialog] = useState(false)
  const [showAddRequisitionDialog, setShowAddRequisitionDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)

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

  // Removed duplicate newCertificate declaration

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
    attachments: [] as File[],
    items: [] as Array<{
      id: string;
      name: string;
      description: string;
      quantity: number;
      unit: string;
    }>
  })

  // Requisition item form state
  const [newRequisitionItem, setNewRequisitionItem] = useState({
    name: "",
    description: "",
    quantity: 1,
    unit: "pcs"
  })

  // Requisition image upload states
  const [requisitionImages, setRequisitionImages] = useState<File[]>([])
  const [requisitionPreviews, setRequisitionPreviews] = useState<{[key: string]: string}>({})
  const [requisitionUploadProgress, setRequisitionUploadProgress] = useState<{[key: string]: number}>({})
  const [isRequisitionUploading, setIsRequisitionUploading] = useState(false)

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    estimatedHours: ""
  })

  const [newDrawing, setNewDrawing] = useState({
    name: "",
    description: "",
    partNumber: "",
    quantity: 1,
    category: "General" as "Equipment drawing" | "Engine drawing" | "General",
    engineType: "",
    spares: [] as Array<{
      spareName: string;
      make: string;
      partNumber: string;
      description: string;
      quantity: number;
      unit: string;
    }>
  })

  // Certificate form state
  const [newCertificate, setNewCertificate] = useState({
    name: "",
    issuingAuthority: "",
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
    attachments: [] as File[]
  })

  // Drawing file upload states
  const [drawingFiles, setDrawingFiles] = useState<File[]>([])
  const [drawingPreviews, setDrawingPreviews] = useState<{[key: string]: string}>({})
  const [drawingUploadProgress, setDrawingUploadProgress] = useState<{[key: string]: number}>({})
  const [isDrawingUploading, setIsDrawingUploading] = useState(false)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  
  // Drawing creation workflow states
  const [drawingStep, setDrawingStep] = useState(1) // 1: Basic Info, 2: Spare Parts, 3: File Upload
  const [createdDrawingId, setCreatedDrawingId] = useState<string | null>(null)
  const [editingDrawing, setEditingDrawing] = useState({
    id: "",
    name: "",
    description: "",
    partNumber: "",
    quantity: 1,
    category: "General" as "Equipment drawing" | "Engine drawing" | "General",
    engineType: "",
    spares: [] as Array<{
      id: string;
      spareName: string;
      make: string;
      partNumber: string;
      description: string;
      quantity: number;
      unit: string;
    }>,
    documentUrl: "",
    thumbnailUrl: "",
    fileSize: 0,
    fileType: "",
    createdAt: ""
  })

  // Find current ship
  useEffect(() => {
    if (!ships || ships.length === 0 || !shipId) {
      return // Wait for ships to load or ensure shipId is available
    }
    
    const ship = ships.find(s => s.id === shipId)
    if (ship) {
      setCurrentShip(ship)
      loadShipData(shipId)
    } else {
      // Ship not found, redirect or show error
      console.warn("Ship not found:", shipId, "Available ships:", ships.map(s => s.id))
      toast.error("Ship not found")
      router.push("/dashboard/ships")
    }
  }, [ships, shipId, router]) // Removed setCurrentShip to prevent infinite loop

  const loadShipData = async (id: string) => {
    setLoadingData(true)
    try {
      const [crewData, certData, drawingData, invData, reqData, taskData] = await Promise.all([
        getShipCrew(id),
        getShipCertificates(id),
        getShipDrawings(id),
        getShipInventory(id),
        getShipRequisitions(id),
        getShipTasks(id)
      ])
      
      setCrew(crewData)
      setCertificates(certData)
      setDrawings(drawingData)
      setInventory(invData)
      setRequisitions(reqData)
      setTasks(taskData)
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
  
  


  // Certificate file upload handlers
  const handleCertificateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processCertificateFiles(files)
    // Clear the input
    e.target.value = ''
  }

  const processCertificateFiles = (files: File[]) => {
    if (files.length === 0) return

    // Validate file types (images and PDFs only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    const invalidFiles = files.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error("Only images (JPEG, PNG, GIF) and PDF files are allowed")
      return
    }

    // Validate file sizes (max 10MB per file)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error("Files must be smaller than 10MB")
      return
    }

    // Add files to attachments
    setNewCertificate(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const handleCertificateDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    processCertificateFiles(files)
  }

  const handleCertificateDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeCertificateFile = (index: number) => {
    setNewCertificate(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const getCertificateFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  // Requisition image upload handlers
  const handleRequisitionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processRequisitionImages(files)
    // Clear the input
    e.target.value = ''
  }

  const processRequisitionImages = (files: File[]) => {
    if (files.length === 0) return

    // Validate file types (images only for requisitions)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = files.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error("Only image files (JPEG, PNG, GIF, WebP) are allowed")
      return
    }

    // Validate file sizes (max 5MB per file for images)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error("Images must be smaller than 5MB")
      return
    }

    // Add files to requisition images
    setRequisitionImages(prev => [...prev, ...files])

    // Generate previews for image files
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setRequisitionPreviews(prev => ({
          ...prev,
          [file.name]: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    })

    // Update newRequisition attachments
    setNewRequisition(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const handleRequisitionImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    processRequisitionImages(files)
  }

  const handleRequisitionImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeRequisitionImage = (index: number) => {
    const fileToRemove = requisitionImages[index]
    
    // Remove from images array
    setRequisitionImages(prev => prev.filter((_, i) => i !== index))
    
    // Remove from previews
    if (fileToRemove && requisitionPreviews[fileToRemove.name]) {
      setRequisitionPreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[fileToRemove.name]
        return newPreviews
      })
    }

    // Remove from newRequisition attachments
    setNewRequisition(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
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
        certificateNumber: "",
        attachments: []
      })
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to add certificate: " + error.message)
    }
  }

  // Drawing CRUD handlers
  const handleAddDrawing = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (drawingStep === 1) {
      // Step 1: Create basic drawing info and move to next step
      if (!newDrawing.name || !newDrawing.partNumber || !newDrawing.description) {
        toast.error("Please fill in required fields")
        return
      }
      
      try {
        setIsDrawingUploading(true)
        
        const drawingData: any = {
          name: newDrawing.name,
          partNumber: newDrawing.partNumber,
          description: newDrawing.description,
          quantity: newDrawing.quantity,
          category: newDrawing.category,
          engineType: newDrawing.engineType || "",
          spares: [],
          createdBy: user?.uid || "",
          createdAt: new Date()
        }

        const drawingId = await addDrawing(shipId, drawingData)
        setCreatedDrawingId(drawingId)
        setDrawingStep(2)
        toast.success("Drawing created! Now add spare parts.")
      } catch (error: any) {
        toast.error("Failed to create drawing: " + error.message)
      } finally {
        setIsDrawingUploading(false)
      }
    } else if (drawingStep === 2) {
      // Step 2: Update drawing with spare parts and move to file upload step
      if (createdDrawingId && newDrawing.spares.length > 0) {
        try {
          setIsDrawingUploading(true)
          
          const updatedDrawingData: any = {
            spares: newDrawing.spares,
            updatedBy: user?.uid || "",
            updatedAt: new Date()
          }

          await updateDrawing(shipId, createdDrawingId, updatedDrawingData)
          setDrawingStep(3)
          toast.success("Spare parts added! Now upload drawing files.")
        } catch (error: any) {
          toast.error("Failed to add spare parts: " + error.message)
        } finally {
          setIsDrawingUploading(false)
        }
      } else {
        // Skip spare parts if none added
        setDrawingStep(3)
        toast.info("Skipped spare parts. Now upload drawing files.")
      }
    } else if (drawingStep === 3) {
      // Step 3: Complete the process
      setShowAddDrawingDialog(false)
      setDrawingStep(1)
      setCreatedDrawingId(null)
      setNewDrawing({
        name: "",
        description: "",
        partNumber: "",
        quantity: 1,
        category: "General",
        engineType: "",
        spares: []
      })
      setDrawingFiles([])
      setDrawingPreviews({})
      
      loadShipData(shipId)
      toast.success("Drawing creation completed!")
    }
  }

  const handleViewDrawing = (drawing: Drawing) => {
    setSelectedDrawing(drawing)
    setShowViewDrawingDialog(true)
  }

  const handleEditDrawing = (drawing: Drawing) => {
    setSelectedDrawing(drawing)
    setEditingDrawing({
      id: drawing.id,
      name: drawing.name,
      partNumber: drawing.partNumber,
      description: drawing.description || "",
      category: drawing.category || "General",
      quantity: drawing.quantity || 1,
      engineType: drawing.engineType || "",
      spares: drawing.spares?.map(spare => ({
        id: spare.id || `spare-${Date.now()}-${Math.random()}`,
        spareName: spare.spareName,
        make: spare.make || "",
        partNumber: spare.partNumber,
        description: spare.description || "",
        quantity: spare.quantity || 1,
        unit: spare.unit || "pcs"
      })) || [],
      documentUrl: drawing.documentUrl || "",
      thumbnailUrl: drawing.thumbnailUrl || "",
      fileSize: drawing.fileSize || 0,
      fileType: drawing.fileType || "",
      createdAt: drawing.createdAt?.toISOString() || new Date().toISOString()
    })
    
    // Reset the new spare form
    setNewSpare({
      spareName: "",
      make: "",
      partNumber: "",
      description: "",
      quantity: 1,
      unit: "pcs"
    })
    
    setShowEditDrawingDialog(true)
  }

  const handleUpdateDrawing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDrawing || !editingDrawing.name || !editingDrawing.partNumber) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      setIsDrawingUploading(true)
      
      const updatedDrawingData: any = {
        name: editingDrawing.name,
        partNumber: editingDrawing.partNumber,
        description: editingDrawing.description || "",
        category: editingDrawing.category || "General",
        quantity: editingDrawing.quantity || 1,
        engineType: editingDrawing.engineType || "",
        spares: editingDrawing.spares || [],
        updatedBy: user?.uid || "",
        updatedAt: new Date()
      }

      // Call update function from useShips hook
      await updateDrawing(shipId, selectedDrawing.id, updatedDrawingData)
      toast.success("Drawing updated successfully")
      setShowEditDrawingDialog(false)
      setSelectedDrawing(null)
      setEditingDrawing({
        id: "",
        name: "",
        partNumber: "",
        description: "",
        category: "General" as "Equipment drawing" | "Engine drawing" | "General",
        quantity: 1,
        engineType: "",
        spares: [],
        documentUrl: "",
        thumbnailUrl: "",
        fileSize: 0,
        fileType: "",
        createdAt: ""
      })
      
      // Reset new spare form
      setNewSpare({
        spareName: "",
        make: "",
        partNumber: "",
        description: "",
        quantity: 1,
        unit: "pcs"
      })
      
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to update drawing: " + error.message)
    } finally {
      setIsDrawingUploading(false)
    }
  }

  const handleDeleteDrawing = (drawing: Drawing) => {
    setSelectedDrawing(drawing)
    setShowDeleteDrawingDialog(true)
  }

  const confirmDeleteDrawing = async () => {
    if (!selectedDrawing) return

    try {
      // Call delete function from useShips hook
      await deleteDrawing(shipId, selectedDrawing.id)
      
      // Update local drawings state immediately
      setDrawings(prevDrawings => 
        prevDrawings.filter(drawing => drawing.id !== selectedDrawing.id)
      )
      
      toast.success("Drawing deleted successfully")
      setShowDeleteDrawingDialog(false)
      setSelectedDrawing(null)
      
      // Reload data to ensure consistency
      loadShipData(shipId)
    } catch (error: any) {
      toast.error("Failed to delete drawing: " + error.message)
    }
  }

  const handleDrawingFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      processDrawingFiles(Array.from(files))
    }
  }

  const handleDrawingDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files) {
      processDrawingFiles(Array.from(files))
    }
  }

  const handleDrawingDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const processDrawingFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      
      if (!isValidType) {
        toast.error(`${file.name}: Only images and PDF files are allowed`)
        return false
      }
      if (!isValidSize) {
        toast.error(`${file.name}: File size must be less than 10MB`)
        return false
      }
      return true
    })

    setDrawingFiles(prev => [...prev, ...validFiles])

    // Generate previews for image files
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setDrawingPreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeDrawingFile = (index: number) => {
    const fileToRemove = drawingFiles[index]
    setDrawingFiles(prev => prev.filter((_, i) => i !== index))
    
    if (fileToRemove && drawingPreviews[fileToRemove.name]) {
      setDrawingPreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[fileToRemove.name]
        return newPreviews
      })
    }
  }

  // Spare part handling functions
  const [newSpare, setNewSpare] = useState({
    spareName: "",
    make: "",
    partNumber: "",
    description: "",
    quantity: 1,
    unit: "pcs"
  })

  const handleAddSpare = () => {
    if (!newSpare.spareName || !newSpare.make || !newSpare.partNumber) {
      toast.error("Please fill in spare name, make, and part number")
      return
    }

    const spare = {
      ...newSpare,
      id: `spare-${Date.now()}` // Generate unique ID
    }

    setNewDrawing(prev => ({
      ...prev,
      spares: [...prev.spares, spare]
    }))

    // Reset spare form
    setNewSpare({
      spareName: "",
      make: "",
      partNumber: "",
      description: "",
      quantity: 1,
      unit: "pcs"
    })

    toast.success("Spare part added to list")
  }

  const handleRemoveSpare = (index: number) => {
    setNewDrawing(prev => ({
      ...prev,
      spares: prev.spares.filter((_, i) => i !== index)
    }))
    toast.success("Spare part removed")
  }

  const handleGoToPrevStep = () => {
    if (drawingStep > 1) {
      setDrawingStep(drawingStep - 1)
    }
  }

  const handleGoToNextStep = () => {
    if (drawingStep < 3) {
      setDrawingStep(drawingStep + 1)
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

  const handleAddRequisitionItem = () => {
    if (!newRequisitionItem.name || newRequisitionItem.quantity <= 0) {
      toast.error("Please fill in item name and quantity")
      return
    }

    const item = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: newRequisitionItem.name,
      description: newRequisitionItem.description,
      quantity: newRequisitionItem.quantity,
      unit: newRequisitionItem.unit
    }

    setNewRequisition(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    // Reset item form
    setNewRequisitionItem({
      name: "",
      description: "",
      quantity: 1,
      unit: "pcs"
    })

    toast.success("Item added to requisition")
  }

  const handleRemoveRequisitionItem = (index: number) => {
    setNewRequisition(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    toast.success("Item removed from requisition")
  }

  const handleAddRequisition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequisition.title || !newRequisition.requiredDate) {
      toast.error("Please fill in required fields")
      return
    }

    if (newRequisition.items.length === 0) {
      toast.error("Please add at least one item to the requisition")
      return
    }

    try {
      setIsRequisitionUploading(true)
      
      // Upload images to Firebase Storage if any
      let attachmentUrls: string[] = []
      if (newRequisition.attachments.length > 0) {
        const basePath = `ships/${shipId}/requisitions/attachments`
        attachmentUrls = await storageService.uploadFiles(newRequisition.attachments, basePath)
      }
      
      // Prepare notes with attachment URLs if any
      let notesWithAttachments = newRequisition.description || ""
      if (attachmentUrls.length > 0) {
        notesWithAttachments += `${notesWithAttachments ? '\n\n' : ''}Attachments:\n${attachmentUrls.join('\n')}`
      }
      
      const reqData = {
        type: newRequisition.type,
        requestedBy: user?.uid || "current-user",
        requestDate: new Date(),
        requiredDate: new Date(newRequisition.requiredDate),
        status: "pending" as const,
        priority: newRequisition.priority as 'low' | 'medium' | 'high' | 'urgent',
        items: newRequisition.items,
        notes: notesWithAttachments
        // Note: attachmentUrls are included in notes field for now since Requisition interface doesn't have attachments field
      }

      await createRequisition(shipId, reqData)
      toast.success("Requisition created successfully")
      setShowAddRequisitionDialog(false)
      
      // Reset all form state including images
      setNewRequisition({
        title: "",
        description: "",
        type: "material",
        priority: "medium",
        requiredDate: "",
        attachments: [],
        items: []
      })
      
      // Reset item form
      setNewRequisitionItem({
        name: "",
        description: "",
        quantity: 1,
        unit: "pcs"
      })
      
      // Reset image-related state
      setRequisitionImages([])
      setRequisitionPreviews({})
      setRequisitionUploadProgress({})
      
      loadShipData(shipId)
    } catch (error: any) {
      console.error("Failed to create requisition:", error)
      toast.error("Failed to create requisition: " + error.message)
    } finally {
      setIsRequisitionUploading(false)
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

  if (isLoading || loadingData || !ships) {
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="drawings">Drawings</TabsTrigger>
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
              <Button onClick={() => setShowAddCrewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Crew Member
              </Button>
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

          {/* Drawings Tab */}
          <TabsContent value="drawings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Drawings</h3>
              <Button onClick={() => setShowAddDrawingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Drawing
              </Button>
            </div>

            <div className="grid gap-4">
              {drawings.map((drawing) => (
                <Card key={drawing.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Main Drawing Information */}
                      <div className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <PenTool className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{drawing.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{drawing.description}</p>
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Part Number</p>
                                  <p className="text-sm font-medium text-blue-600">{drawing.partNumber}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Quantity</p>
                                  <p className="text-sm font-medium">{drawing.quantity} Nos</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Category</p>
                                  <Badge variant="outline" className="text-xs">
                                    {drawing.category}
                                  </Badge>
                                </div>
                              </div>
                              {drawing.category === "Engine drawing" && drawing.engineType && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 uppercase">Engine Type</p>
                                  <p className="text-sm font-medium text-green-600">{drawing.engineType}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDrawing(drawing)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDrawing(drawing)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDrawing(drawing)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Spares with Drawing Section */}
                      {drawing.spares && drawing.spares.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Spare with Drawing</h5>
                          <div className="grid gap-3">
                            {drawing.spares.map((spare, index) => (
                              <div key={spare.id || index} className="bg-gray-50 rounded-lg p-3">
                                <div className="grid grid-cols-5 gap-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Spare Name</p>
                                    <p className="text-sm font-medium">{spare.spareName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Make</p>
                                    <p className="text-sm font-medium text-green-600">{spare.make || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Part Number</p>
                                    <p className="text-sm font-medium text-blue-600">{spare.partNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Quantity</p>
                                    <p className="text-sm font-medium">{spare.quantity} {spare.unit}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase">Description</p>
                                    <p className="text-sm text-gray-600">{spare.description || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Document Preview/Thumbnail */}
                      {(drawing.documentUrl || drawing.thumbnailUrl) && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500 uppercase mb-2">Document</p>
                          {drawing.thumbnailUrl && drawing.fileType?.startsWith('image') ? (
                            <img 
                              src={drawing.thumbnailUrl} 
                              alt={drawing.name}
                              className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() => handleViewDrawing(drawing)}
                            />
                          ) : drawing.fileType === 'application/pdf' ? (
                            <div 
                              className="w-24 h-24 bg-red-50 border rounded flex items-center justify-center cursor-pointer hover:bg-red-100"
                              onClick={() => handleViewDrawing(drawing)}
                            >
                              <File className="h-8 w-8 text-red-600" />
                              <span className="text-xs text-red-600 font-medium">PDF</span>
                            </div>
                          ) : (
                            <div 
                              className="w-24 h-24 bg-gray-50 border rounded flex items-center justify-center cursor-pointer hover:bg-gray-100"
                              onClick={() => handleViewDrawing(drawing)}
                            >
                              <PenTool className="h-8 w-8 text-gray-600" />
                            </div>
                          )}
                          {drawing.fileSize && (
                            <p className="text-xs text-gray-400 mt-1">
                              File size: {Math.round(drawing.fileSize / 1024)} KB
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Added: {new Date(drawing.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {drawings.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <PenTool className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold">No Drawings</h4>
                    <p className="text-gray-600 mb-4">Add drawings with part numbers and spare details to organize ship documentation.</p>
                    <Button onClick={() => setShowAddDrawingDialog(true)}>Add First Drawing</Button>
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
                        <div className="text-sm text-gray-600">
                          {req.notes ? (
                            <div className="space-y-2">
                              {req.notes.split('\n').map((line, index) => {
                                // Check if line is an image URL
                                if (line.trim().match(/^https:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
                                  return (
                                    <div key={index} className="mt-2">
                                      <img 
                                        src={line.trim()} 
                                        alt="Requisition attachment"
                                        className="max-w-xs max-h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(line.trim(), '_blank')}
                                      />
                                    </div>
                                  )
                                }
                                // Skip the "Attachments:" header line
                                if (line.trim() === 'Attachments:') {
                                  return (
                                    <p key={index} className="font-medium text-gray-700 mt-2">
                                      Attachments:
                                    </p>
                                  )
                                }
                                // Regular text lines
                                if (line.trim()) {
                                  return <p key={index}>{line}</p>
                                }
                                return null
                              })}
                            </div>
                          ) : (
                            "No description"
                          )}
                        </div>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

              {/* File Upload Section */}
              <div className="space-y-3">
                <Label>Certificate Documents</Label>
                <p className="text-sm text-gray-600">Upload photos or PDF documents of the certificate</p>
                
                {/* Drag and Drop Area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                  onDrop={handleCertificateDrop}
                  onDragOver={handleCertificateDragOver}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-500">
                      Images (JPG, PNG, GIF) or PDF files, max 10MB each
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('cert-file-input')?.click()}
                      className="mt-2"
                    >
                      Choose Files
                    </Button>
                  </div>
                  <input
                    id="cert-file-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleCertificateFileUpload}
                    className="hidden"
                  />
                </div>

                {/* File List */}
                {newCertificate.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Attached Files:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {newCertificate.attachments.map((file, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          {/* File Preview/Icon */}
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-red-100 flex items-center justify-center">
                                <File className="h-6 w-6 text-red-600" />
                              </div>
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.type} • {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCertificateFile(index)}
                            className="h-8 w-8 p-0 hover:bg-red-100 flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        <Dialog open={showAddRequisitionDialog} onOpenChange={(open) => {
          if (!open) {
            // Reset form and image state when dialog closes
            setNewRequisition({
              title: "",
              description: "",
              type: "material",
              priority: "medium",
              requiredDate: "",
              attachments: [],
              items: []
            })
            setNewRequisitionItem({
              name: "",
              description: "",
              quantity: 1,
              unit: "pcs"
            })
            setRequisitionImages([])
            setRequisitionPreviews({})
            setRequisitionUploadProgress({})
          }
          setShowAddRequisitionDialog(open)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Requisition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRequisition} className="space-y-6">
              {/* Basic Requisition Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Requisition Details</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="req-title">Requisition Title *</Label>
                  <Input
                    id="req-title"
                    required
                    value={newRequisition.title}
                    onChange={(e) => setNewRequisition(prev => ({...prev, title: e.target.value}))}
                    placeholder="e.g., Engine Spare Parts"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="req-description">Description</Label>
                  <Textarea
                    id="req-description"
                    value={newRequisition.description}
                    onChange={(e) => setNewRequisition(prev => ({...prev, description: e.target.value}))}
                    placeholder="Additional notes or specifications"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
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
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
              

                {/* Add New Item Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Add New Item</h5>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Item Name *</Label>
                      <Input
                        value={newRequisitionItem.name}
                        onChange={(e) => setNewRequisitionItem(prev => ({...prev, name: e.target.value}))}
                        placeholder="e.g., Engine Oil Filter"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Description</Label>
                      <Input
                        value={newRequisitionItem.description}
                        onChange={(e) => setNewRequisitionItem(prev => ({...prev, description: e.target.value}))}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newRequisitionItem.quantity}
                        onChange={(e) => setNewRequisitionItem(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Unit</Label>
                      <Select value={newRequisitionItem.unit} onValueChange={(value) => setNewRequisitionItem(prev => ({...prev, unit: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="ltr">Liters</SelectItem>
                          <SelectItem value="mtr">Meters</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="roll">Roll</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddRequisitionItem}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item to Requisition
                  </Button>
                </div>

                {/* Items List */}
                {newRequisition.items.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Items:</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                        <div>Item Name</div>
                        <div>Description</div>
                        <div>Quantity</div>
                        <div>Unit</div>
                        <div>Action</div>
                      </div>
                      {newRequisition.items.map((item, index) => (
                        <div key={item.id} className="px-4 py-3 grid grid-cols-5 gap-4 border-t text-sm items-center">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-600">{item.description || "-"}</div>
                          <div>{item.quantity}</div>
                          <div>{item.unit}</div>
                          <div className="flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRequisitionItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
             
              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Attach Images (Optional)</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onDrop={handleRequisitionImageDrop}
                  onDragOver={handleRequisitionImageDragOver}
                  onClick={() => document.getElementById('req-image-upload')?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop images
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WebP up to 5MB each
                  </p>
                  <input
                    id="req-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleRequisitionImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Image Previews */}
                {requisitionImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {requisitionImages.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          {requisitionPreviews[file.name] ? (
                            <img
                              src={requisitionPreviews[file.name]}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequisitionImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddRequisitionDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isRequisitionUploading || newRequisition.items.length === 0}
                >
                  {isRequisitionUploading ? "Creating..." : `Create Requisition (${newRequisition.items.length} items)`}
                </Button>
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
        

           

        {/* View Drawing Dialog */}
        <Dialog open={showViewDrawingDialog} onOpenChange={setShowViewDrawingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Drawing Details</DialogTitle>
            </DialogHeader>
            {selectedDrawing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="text-lg font-semibold">{selectedDrawing.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Part Number</Label>
                    <p className="text-lg font-semibold text-blue-600">{selectedDrawing.partNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                    <p>{selectedDrawing.quantity} Nos</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <p>{selectedDrawing.category}</p>
                  </div>
                  {selectedDrawing.category === "Engine drawing" && selectedDrawing.engineType && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Engine Type</Label>
                      <p>{selectedDrawing.engineType}</p>
                    </div>
                  )}
                  {selectedDrawing.fileType && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">File Type</Label>
                      <p>{selectedDrawing.fileType}</p>
                    </div>
                  )}
                  {selectedDrawing.fileSize && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">File Size</Label>
                      <p>{Math.round(selectedDrawing.fileSize / 1024)} KB</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-1">{selectedDrawing.description || "No description provided"}</p>
                </div>
                
                {/* Document Preview Section */}
                {(selectedDrawing.documentUrl || selectedDrawing.thumbnailUrl) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Document Preview</Label>
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                      {selectedDrawing.fileType?.startsWith('image') ? (
                        <div className="text-center">
                          <img 
                            src={selectedDrawing.thumbnailUrl || selectedDrawing.documentUrl} 
                            alt={selectedDrawing.name}
                            className="max-w-full max-h-64 mx-auto rounded shadow-sm cursor-pointer hover:shadow-md"
                            onClick={() => selectedDrawing.documentUrl && window.open(selectedDrawing.documentUrl, '_blank')}
                          />
                          <p className="text-xs text-gray-500 mt-2">Click to view full size</p>
                        </div>
                      ) : selectedDrawing.fileType === 'application/pdf' ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <File className="h-16 w-16 text-red-600 mx-auto mb-2" />
                            <p className="text-lg font-medium text-gray-900">PDF Document</p>
                            <p className="text-sm text-gray-600">{selectedDrawing.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <PenTool className="h-16 w-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-lg font-medium text-gray-900">Technical Drawing</p>
                            <p className="text-sm text-gray-600">{selectedDrawing.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p>{new Date(selectedDrawing.createdAt).toLocaleDateString()}</p>
                </div>
                
                {selectedDrawing.documentUrl && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => window.open(selectedDrawing.documentUrl, '_blank')}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open Document in New Tab
                    </Button>
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDrawingDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Drawing Dialog */}
        <Dialog open={showEditDrawingDialog} onOpenChange={setShowEditDrawingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Drawing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateDrawing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-drawing-name">Name *</Label>
                  <Input
                    id="edit-drawing-name"
                    required
                    value={editingDrawing.name}
                    onChange={(e) => setEditingDrawing(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-part-number">Part Number *</Label>
                  <Input
                    id="edit-part-number"
                    required
                    value={editingDrawing.partNumber}
                    onChange={(e) => setEditingDrawing(prev => ({...prev, partNumber: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={editingDrawing.quantity}
                    onChange={(e) => setEditingDrawing(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingDrawing.category} onValueChange={(value) => setEditingDrawing(prev => ({...prev, category: value as any}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment drawing">Equipment drawing</SelectItem>
                      <SelectItem value="Engine drawing">Engine drawing</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingDrawing.category === "Engine drawing" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-engine-type">Engine Type</Label>
                    <Input
                      id="edit-engine-type"
                      value={editingDrawing.engineType}
                      onChange={(e) => setEditingDrawing(prev => ({...prev, engineType: e.target.value}))}
                      placeholder="e.g., Turbocharger 9GA6"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editingDrawing.description}
                  onChange={(e) => setEditingDrawing(prev => ({...prev, description: e.target.value}))}
                />
              </div>
              
              {/* Current Document Info */}
              {editingDrawing.documentUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Current Document</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {editingDrawing.fileType?.startsWith('image') && editingDrawing.thumbnailUrl ? (
                        <img 
                          src={editingDrawing.thumbnailUrl} 
                          alt={editingDrawing.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : editingDrawing.fileType === 'application/pdf' ? (
                        <div className="w-16 h-16 bg-red-50 border rounded flex items-center justify-center">
                          <File className="h-8 w-8 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center">
                          <PenTool className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{editingDrawing.name}</p>
                        {editingDrawing.fileType && (
                          <p className="text-sm text-gray-600">Type: {editingDrawing.fileType}</p>
                        )}
                        {editingDrawing.fileSize && (
                          <p className="text-sm text-gray-600">Size: {Math.round(editingDrawing.fileSize / 1024)} KB</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editingDrawing.documentUrl && window.open(editingDrawing.documentUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDrawingDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isDrawingUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isDrawingUploading ? "Updating..." : "Update Drawing"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Drawing Dialog */}
        <Dialog open={showDeleteDrawingDialog} onOpenChange={setShowDeleteDrawingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Drawing</DialogTitle>
            </DialogHeader>
            {selectedDrawing && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      Are you sure you want to delete this drawing?
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold">{selectedDrawing.name}</h4>
                  <p className="text-sm text-gray-600">Part Number: {selectedDrawing.partNumber}</p>
                  <p className="text-sm text-gray-600">Category: {selectedDrawing.category}</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDrawingDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteDrawing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Drawing
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Drawing Dialog - Multi-Step */}
        <Dialog open={showAddDrawingDialog} onOpenChange={(open) => {
          if (!open) {
            setDrawingStep(1)
            setCreatedDrawingId(null)
            setNewDrawing({
              name: "",
              description: "",
              partNumber: "",
              quantity: 1,
              category: "General",
              engineType: "",
              spares: []
            })
            setNewSpare({
              spareName: "",
              make: "",
              partNumber: "",
              description: "",
              quantity: 1,
              unit: "pcs"
            })
            setDrawingFiles([])
            setDrawingPreviews({})
          }
          setShowAddDrawingDialog(open)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Add Drawing - Step {drawingStep} of 3
                {drawingStep === 1 && ": Basic Information"}
                {drawingStep === 2 && ": Spare Parts"}
                {drawingStep === 3 && ": File Upload"}
              </DialogTitle>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < drawingStep ? 'bg-green-500 text-white' : 
                    step === drawingStep ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step < drawingStep ? '✓' : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < drawingStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddDrawing} className="space-y-6">
              {/* Step 1: Basic Drawing Information */}
              {drawingStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Drawing Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="drawing-name">Drawing Name *</Label>
                      <Input
                        id="drawing-name"
                        required
                        value={newDrawing.name}
                        onChange={(e) => setNewDrawing(prev => ({...prev, name: e.target.value}))}
                        placeholder="e.g., Engine Assembly Drawing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="part-number">Part Number *</Label>
                      <Input
                        id="part-number"
                        required
                        value={newDrawing.partNumber}
                        onChange={(e) => setNewDrawing(prev => ({...prev, partNumber: e.target.value}))}
                        placeholder="e.g., 0SF"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        required
                        min="1"
                        value={newDrawing.quantity}
                        onChange={(e) => setNewDrawing(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newDrawing.category} onValueChange={(value) => setNewDrawing(prev => ({...prev, category: value as any}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Equipment drawing">Equipment drawing</SelectItem>
                          <SelectItem value="Engine drawing">Engine drawing</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Engine Type field (only for Engine drawings) */}
                  {newDrawing.category === "Engine drawing" && (
                    <div className="space-y-2">
                      <Label htmlFor="engine-type">Engine Type</Label>
                      <Input
                        id="engine-type"
                        value={newDrawing.engineType}
                        onChange={(e) => setNewDrawing(prev => ({...prev, engineType: e.target.value}))}
                        placeholder="e.g., Turbocharger 9GA6"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      required
                      rows={3}
                      value={newDrawing.description}
                      onChange={(e) => setNewDrawing(prev => ({...prev, description: e.target.value}))}
                      placeholder="Describe the drawing content and purpose"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Spare Parts */}
              {drawingStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Spare Parts with Drawing</h4>
                  </div>

                  {/* Add New Spare Form */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-3">Add New Spare Part</h5>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Spare Name *</Label>
                        <Input
                          value={newSpare.spareName}
                          onChange={(e) => setNewSpare(prev => ({...prev, spareName: e.target.value}))}
                          placeholder="e.g., Bolt"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Make *</Label>
                        <Input
                          value={newSpare.make}
                          onChange={(e) => setNewSpare(prev => ({...prev, make: e.target.value}))}
                          placeholder="e.g., Bosch"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Part Number *</Label>
                        <Input
                          value={newSpare.partNumber}
                          onChange={(e) => setNewSpare(prev => ({...prev, partNumber: e.target.value}))}
                          placeholder="e.g., 0SF123"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={newSpare.description}
                          onChange={(e) => setNewSpare(prev => ({...prev, description: e.target.value}))}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newSpare.quantity}
                          onChange={(e) => setNewSpare(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select value={newSpare.unit} onValueChange={(value) => setNewSpare(prev => ({...prev, unit: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="Nos">Nos</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="l">l</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddSpare}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Spare Part
                    </Button>
                  </div>

                  {/* Existing Spares Table */}
                  {newDrawing.spares.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No spare parts added yet</p>
                      <p className="text-sm text-gray-500">Add spare parts related to this drawing above</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="font-medium">Added Spare Parts</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Spare Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Make</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {newDrawing.spares.map((spare, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm">{spare.spareName}</td>
                                <td className="px-3 py-2 text-sm">{spare.make}</td>
                                <td className="px-3 py-2 text-sm text-blue-600">{spare.partNumber}</td>
                                <td className="px-3 py-2 text-sm">{spare.description || '-'}</td>
                                <td className="px-3 py-2 text-sm">{spare.quantity}</td>
                                <td className="px-3 py-2 text-sm">{spare.unit}</td>
                                <td className="px-3 py-2 text-sm">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSpare(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: File Upload */}
              {drawingStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Upload Drawing Files</h4>
                  
                  {/* File Upload Input */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                    onDrop={handleDrawingDrop}
                    onDragOver={handleDrawingDragOver}
                  >
                    <input
                      type="file"
                      id="drawing-files"
                      multiple
                      accept="image/*,.pdf,.dwg,.dxf"
                      onChange={handleDrawingFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="drawing-files" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Images, PDFs, DWG, DXF files (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {drawingFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Files</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {drawingFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4 text-blue-500" />
                              ) : (
                                <File className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDrawingFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-2">Drawing Summary</h5>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Name:</strong> {newDrawing.name}</p>
                      <p><strong>Part Number:</strong> {newDrawing.partNumber}</p>
                      <p><strong>Category:</strong> {newDrawing.category}</p>
                      <p><strong>Spare Parts:</strong> {newDrawing.spares.length} added</p>
                      <p><strong>Files:</strong> {drawingFiles.length} uploaded</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <div>
                  {drawingStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoToPrevStep}
                    >
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDrawingDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isDrawingUploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isDrawingUploading ? "Processing..." : 
                     drawingStep === 1 ? "Create Drawing" : 
                     drawingStep === 2 ? "Continue to Upload" : 
                     "Complete"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Drawing Dialog */}
        <Dialog open={showViewDrawingDialog} onOpenChange={setShowViewDrawingDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Drawing Details</DialogTitle>
            </DialogHeader>
            {selectedDrawing && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Drawing Name</Label>
                      <p className="text-lg font-semibold">{selectedDrawing.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Part Number</Label>
                      <p className="text-lg font-semibold text-blue-600">{selectedDrawing.partNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Category</Label>
                      <Badge variant="outline" className="w-fit">
                        {selectedDrawing.category}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                      <p className="font-medium">{selectedDrawing.quantity} Nos</p>
                    </div>
                    {selectedDrawing.category === "Engine drawing" && selectedDrawing.engineType && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-600">Engine Type</Label>
                        <p className="font-medium text-green-600">{selectedDrawing.engineType}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="mt-1 text-gray-700">{selectedDrawing.description || "No description provided"}</p>
                  </div>
                </div>

                {/* Spare Parts */}
                {selectedDrawing.spares && selectedDrawing.spares.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Spare Parts ({selectedDrawing.spares.length})</h4>
                    <div className="space-y-3">
                      {selectedDrawing.spares.map((spare, index) => (
                        <div key={spare.id || index} className="bg-white rounded-lg p-3 border">
                          <div className="grid grid-cols-5 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500 uppercase">Spare Name</Label>
                              <p className="text-sm font-medium">{spare.spareName}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 uppercase">Make</Label>
                              <p className="text-sm font-medium text-green-600">{spare.make || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 uppercase">Part Number</Label>
                              <p className="text-sm font-medium text-blue-600">{spare.partNumber}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 uppercase">Quantity</Label>
                              <p className="text-sm font-medium">{spare.quantity} {spare.unit}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 uppercase">Description</Label>
                              <p className="text-sm text-gray-600">{spare.description || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Information */}
                {(selectedDrawing.documentUrl || selectedDrawing.fileType) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Document Information</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 uppercase">File Type</Label>
                        <p className="text-sm font-medium">{selectedDrawing.fileType || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase">File Size</Label>
                        <p className="text-sm font-medium">
                          {selectedDrawing.fileSize ? `${Math.round(selectedDrawing.fileSize / 1024)} KB` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase">Created</Label>
                        <p className="text-sm font-medium">
                          {selectedDrawing.createdAt ? new Date(selectedDrawing.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDrawingDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Drawing Dialog */}
        <Dialog open={showEditDrawingDialog} onOpenChange={setShowEditDrawingDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Drawing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateDrawing} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-drawing-name">Drawing Name *</Label>
                    <Input
                      id="edit-drawing-name"
                      required
                      value={editingDrawing.name}
                      onChange={(e) => setEditingDrawing(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-part-number">Part Number *</Label>
                    <Input
                      id="edit-part-number"
                      required
                      value={editingDrawing.partNumber}
                      onChange={(e) => setEditingDrawing(prev => ({...prev, partNumber: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={editingDrawing.category} onValueChange={(value: "Equipment drawing" | "Engine drawing" | "General") => setEditingDrawing(prev => ({...prev, category: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Equipment drawing">Equipment Drawing</SelectItem>
                        <SelectItem value="Engine drawing">Engine Drawing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min="1"
                      value={editingDrawing.quantity}
                      onChange={(e) => setEditingDrawing(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                    />
                  </div>
                  {editingDrawing.category === "Engine drawing" && (
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="edit-engine-type">Engine Type</Label>
                      <Input
                        id="edit-engine-type"
                        value={editingDrawing.engineType}
                        onChange={(e) => setEditingDrawing(prev => ({...prev, engineType: e.target.value}))}
                        placeholder="e.g., Marine Diesel Engine"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={editingDrawing.description}
                    onChange={(e) => setEditingDrawing(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe the drawing and its purpose..."
                  />
                </div>
              </div>

              {/* Spare Parts Management */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-4">Spare Parts with Drawing</h4>
                
                {/* Add New Spare Part Form */}
                <div className="bg-white rounded-lg p-4 border mb-4">
                  <h5 className="font-medium mb-3">Add Spare Part</h5>
                  <div className="grid grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Spare Name *</Label>
                      <Input
                        placeholder="Spare name"
                        value={newSpare.spareName}
                        onChange={(e) => setNewSpare(prev => ({...prev, spareName: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Make *</Label>
                      <Input
                        placeholder="Manufacturer"
                        value={newSpare.make}
                        onChange={(e) => setNewSpare(prev => ({...prev, make: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Part Number *</Label>
                      <Input
                        placeholder="Part number"
                        value={newSpare.partNumber}
                        onChange={(e) => setNewSpare(prev => ({...prev, partNumber: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Description"
                        value={newSpare.description}
                        onChange={(e) => setNewSpare(prev => ({...prev, description: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newSpare.quantity}
                        onChange={(e) => setNewSpare(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={newSpare.unit} onValueChange={(value) => setNewSpare(prev => ({...prev, unit: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="ltr">Liters</SelectItem>
                          <SelectItem value="mtr">Meters</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newSpare.spareName || !newSpare.make || !newSpare.partNumber) {
                        toast.error("Please fill in spare name, make, and part number")
                        return
                      }
                      const spare = {
                        ...newSpare,
                        id: `spare-${Date.now()}`
                      }
                      setEditingDrawing(prev => ({
                        ...prev,
                        spares: [...prev.spares, spare]
                      }))
                      setNewSpare({
                        spareName: "",
                        make: "",
                        partNumber: "",
                        description: "",
                        quantity: 1,
                        unit: "pcs"
                      })
                      toast.success("Spare part added to list")
                    }}
                    className="mt-3"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Spare Part
                  </Button>
                </div>

                {/* Current Spare Parts List */}
                {editingDrawing.spares.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Spare Parts ({editingDrawing.spares.length})</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {editingDrawing.spares.map((spare, index) => (
                        <div key={spare.id || index} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="grid grid-cols-5 gap-3 flex-1">
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Spare Name</p>
                              <p className="text-sm font-medium">{spare.spareName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Make</p>
                              <p className="text-sm font-medium text-green-600">{spare.make || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Part Number</p>
                              <p className="text-sm font-medium text-blue-600">{spare.partNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Quantity</p>
                              <p className="text-sm">{spare.quantity} {spare.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Description</p>
                              <p className="text-sm text-gray-600">{spare.description || 'N/A'}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDrawing(prev => ({
                                ...prev,
                                spares: prev.spares.filter((_, i) => i !== index)
                              }))
                              toast.success("Spare part removed")
                            }}
                            className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDrawingDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isDrawingUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isDrawingUploading ? "Updating..." : "Update Drawing"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Drawing Dialog */}
        <Dialog open={showDeleteDrawingDialog} onOpenChange={setShowDeleteDrawingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Drawing</DialogTitle>
            </DialogHeader>
            {selectedDrawing && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      Are you sure you want to delete this drawing?
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold">{selectedDrawing.name}</h4>
                  <p className="text-sm text-gray-600">Part Number: {selectedDrawing.partNumber}</p>
                  <p className="text-sm text-gray-600">Category: {selectedDrawing.category}</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDrawingDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteDrawing}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Drawing
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

