"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
  Ship,
  Package,
  Eye,
  Edit,
  Trash2,
  CalendarIcon,
  ArrowLeft
} from "lucide-react"
import { useShips } from "@/hooks/use-ships"
import { useRequisitions } from "@/hooks/use-requisitions"
import { usePermissions } from "@/hooks/use-permissions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

// Form schema for ship requisition
const shipRequisitionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["material", "service"]),
  requiredDate: z.date(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
    estimatedPrice: z.number().min(0, "Price must be positive").optional()
  })).min(1, "At least one item is required")
})

export default function ShipRequisitionPage() {
  const params = useParams()
  const shipId = params.id as string

  const { ships, getShipById } = useShips()
  const { 
    requisitions, 
    createRequisition,
    loadRequisitions,
    updateRequisition,
    deleteRequisition
  } = useRequisitions()
  const { canCreateRequisition, canApproveRequisition } = usePermissions()

  const [ship, setShip] = useState<any>(null)
  const [shipRequisitions, setShipRequisitions] = useState<any[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const form = useForm<z.infer<typeof shipRequisitionSchema>>({
    resolver: zodResolver(shipRequisitionSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "material",
      priority: "medium",
      items: [{ name: "", description: "", quantity: 1, unit: "", estimatedPrice: 0 }]
    }
  })

  // Load ship data and ship-specific requisitions
  useEffect(() => {
    const loadShipData = async () => {
      if (shipId) {
        const shipData = await getShipById(shipId)
        setShip(shipData)
        
        // Load requisitions and filter for this ship
        await loadRequisitions({ shipId })
      }
    }
    loadShipData()
  }, [shipId])

  // Filter requisitions for this ship
  useEffect(() => {
    const filtered = requisitions.filter(req => 
      req.shipId === shipId &&
      (searchTerm === "" || 
       req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       req.prNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || req.status === statusFilter)
    )
    setShipRequisitions(filtered)
  }, [requisitions, shipId, searchTerm, statusFilter])

  const handleCreateRequisition = async (data: z.infer<typeof shipRequisitionSchema>) => {
    try {
      if (!ship) {
        toast.error("Ship data not loaded")
        return
      }

      await createRequisition({
          title: data.title,
          description: data.description,
          type: data.type as import("@/lib/types/requisition").RequisitionType,
          department: "Ship Operations",
          shipId: shipId,
          requiredDate: data.requiredDate,
          priority: data.priority,
          items: data.items.map((item, index) => ({
              id: `item-${Date.now()}-${index}`,
              itemNumber: `${index + 1}`,
              name: item.name,
              description: item.description || "",
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.estimatedPrice,
              totalPrice: (item.estimatedPrice || 0) * item.quantity,
              preferredVendor: undefined,
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
          attachments: [],
          requestDate: new Date(),
          requestedBy: "",
          companyId: ""
      })
      
      toast.success("Ship requisition created successfully")
      setShowCreateDialog(false)
      form.reset()
    } catch (error: any) {
      toast.error("Failed to create requisition: " + error.message)
    }
  }

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

  if (!ship) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Ship className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p>Loading ship data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/ships/${shipId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ship
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {ship.name} - Requisitions
            </h1>
            <p className="text-slate-600 mt-1">
              Manage material and service requisitions for {ship.name}
            </p>
          </div>
        </div>
        {canCreateRequisition() && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                New Ship Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Ship Requisition</DialogTitle>
                <DialogDescription>
                  Create a new requisition for {ship.name}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateRequisition)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    control={form.control}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      control={form.control}
                      name="requiredDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Required Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                type="button"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)
                                  return date < today
                                }}
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
                    {form.watch("items").map((_, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                        <FormField
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                            const currentItems = form.getValues("items")
                            if (currentItems.length > 1) {
                              form.setValue("items", currentItems.filter((_, i) => i !== index))
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
                        const currentItems = form.getValues("items")
                        form.setValue("items", [
                          ...currentItems,
                          { name: "", description: "", quantity: 1, unit: "", estimatedPrice: 0 }
                        ])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Requisition</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Ship Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Ship className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{ship.name}</h3>
              <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 mt-2">
                <div>
                  <span className="font-medium">IMO:</span> {ship.imo}
                </div>
                <div>
                  <span className="font-medium">Flag:</span> {ship.flag}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {ship.type}
                </div>
                <div>
                  <span className="font-medium">Status:</span> <Badge variant="outline">{ship.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {shipRequisitions.filter(r => r.status === 'pending').length}
                </p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {shipRequisitions.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-sm text-slate-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{shipRequisitions.length}</p>
                <p className="text-sm text-slate-600">Total Requisitions</p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {shipRequisitions.filter(r => r.priority === 'urgent').length}
                </p>
                <p className="text-sm text-slate-600">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisitions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ship Requisitions</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search requisitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shipRequisitions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipRequisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.prNumber}</TableCell>
                    <TableCell>{req.title}</TableCell>
                    <TableCell className="capitalize">{req.type}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell>${req.totalCost.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(req.requiredDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canApproveRequisition() && req.status === "pending" && (
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Requisitions</h3>
              <p className="text-slate-600">
                No requisitions found for {ship.name}. Create the first one to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
