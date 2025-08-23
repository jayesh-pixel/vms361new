"use client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Download,
  Upload,
  BarChart3,
  Calendar,
  MapPin,
  DollarSign,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useInventory } from "@/hooks/use-inventory"
import { useState, useEffect } from "react"
import { InventoryItem, InventoryCategory, CreateInventoryItemRequest, UpdateInventoryItemRequest, StockMovement } from "@/lib/services/inventory-service"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const INVENTORY_CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'engine_parts', label: 'Engine Parts' },
  { value: 'deck_equipment', label: 'Deck Equipment' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'safety_equipment', label: 'Safety Equipment' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'galley', label: 'Galley' },
  { value: 'medical', label: 'Medical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'spare_parts', label: 'Spare Parts' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'lubricants', label: 'Lubricants' },
  { value: 'tools', label: 'Tools' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
];

const UNITS = [
  'pcs', 'kg', 'lbs', 'liters', 'gallons', 'meters', 'feet', 'inches', 
  'tons', 'boxes', 'bottles', 'cans', 'rolls', 'sheets', 'sets'
];

export default function InventoryPage() {
  const { canManageInventory, isViewer } = usePermissions()
  const { items, stats, lowStockItems, loading, createItem, updateItem, deleteItem, updateStock, searchItems, getStockMovements, refetch } = useInventory()
  
  // State for dialogs and forms
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  
  // Form state
  const [newItem, setNewItem] = useState<CreateInventoryItemRequest>({
    partNumber: '',
    name: '',
    description: '',
    category: 'spare_parts',
    subCategory: '',
    quantity: 0,
    unit: 'pcs',
    minStock: 0,
    reorderPoint: 0,
    location: '',
    shipId: '',
    supplier: '',
    unitCost: 0,
    notes: '',
  })
  
  const [editingItem, setEditingItem] = useState<UpdateInventoryItemRequest>({})
  
  // Stock update form
  const [stockUpdate, setStockUpdate] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment' | 'transfer',
    quantity: 0,
    reason: '',
    reference: '',
  })
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  
  // Filtered items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handle search
  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await searchItems(searchTerm)
    } else {
      refetch()
    }
  }

  // Handle add item
  const handleAddItem = async () => {
    try {
      await createItem(newItem)
      setAddDialogOpen(false)
      setNewItem({
        partNumber: '',
        name: '',
        description: '',
        category: 'spare_parts',
        subCategory: '',
        quantity: 0,
        unit: 'pcs',
        minStock: 0,
        reorderPoint: 0,
        location: '',
        shipId: '',
        supplier: '',
        unitCost: 0,
        notes: '',
      })
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  // Handle edit item
  const handleEditItem = async () => {
    if (!selectedItem) return
    
    try {
      await updateItem(selectedItem.id, editingItem)
      setEditDialogOpen(false)
      setSelectedItem(null)
      setEditingItem({})
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  // Handle delete item
  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      await deleteItem(item.id)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!selectedItem) return
    
    try {
      await updateStock(
        selectedItem.id,
        stockUpdate.quantity,
        stockUpdate.type,
        stockUpdate.reason,
        stockUpdate.reference || undefined
      )
      setStockDialogOpen(false)
      setStockUpdate({
        type: 'in',
        quantity: 0,
        reason: '',
        reference: '',
      })
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  // Open edit dialog
  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditingItem({
      partNumber: item.partNumber,
      name: item.name,
      description: item.description,
      category: item.category,
      subCategory: item.subCategory,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      maxStock: item.maxStock,
      reorderPoint: item.reorderPoint,
      location: item.location,
      supplier: item.supplier,
      unitCost: item.unitCost,
      notes: item.notes,
    })
    setEditDialogOpen(true)
  }

  // Open view dialog
  const openViewDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setViewDialogOpen(true)
  }

  // Open stock dialog
  const openStockDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setStockDialogOpen(true)
  }

  // Open movements dialog
  const openMovementsDialog = async (item: InventoryItem) => {
    setSelectedItem(item)
    const movements = await getStockMovements(item.id)
    setStockMovements(movements)
    setMovementsDialogOpen(true)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />In Stock</Badge>
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="h-3 w-3 mr-1" />Low Stock</Badge>
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Out of Stock</Badge>
      case 'on_order':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="h-3 w-3 mr-1" />On Order</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout currentPage="inventory">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-slate-600 mt-1">Track parts, supplies, and stock levels across all ships</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canManageInventory() && (
              <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalItems || 0}</p>
                  <p className="text-sm text-slate-600">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.lowStockItems || 0}</p>
                  <p className="text-sm text-slate-600">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">${(stats?.totalValue || 0).toLocaleString()}</p>
                  <p className="text-sm text-slate-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.reorderNeeded || 0}</p>
                  <p className="text-sm text-slate-600">Reorder Needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, part number, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {INVENTORY_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="on_order">On Order</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Inventory</TabsTrigger>
            <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            Loading inventory...
                          </TableCell>
                        </TableRow>
                      ) : filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            No inventory items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.partNumber}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {INVENTORY_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={item.quantity <= item.reorderPoint ? 'text-red-600 font-semibold' : ''}>
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                {item.location}
                              </div>
                            </TableCell>
                            <TableCell>${(item.totalValue || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openViewDialog(item)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canManageInventory() && (
                                    <>
                                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openStockDialog(item)}>
                                        <Package className="h-4 w-4 mr-2" />
                                        Update Stock
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openMovementsDialog(item)}>
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Stock History
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteItem(item)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="low_stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">All Good!</h3>
                    <p className="text-slate-600">No items are currently low on stock.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.name}</h4>
                            <Badge variant="outline">{item.partNumber}</Badge>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Current: {item.quantity} {item.unit} | Minimum: {item.minStock} {item.unit}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </p>
                        </div>
                        {canManageInventory() && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => openStockDialog(item)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Restock
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats?.categories || {}).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">
                          {INVENTORY_CATEGORIES.find(c => c.value === category)?.label || category}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Stock Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        In Stock
                      </span>
                      <Badge variant="secondary">
                        {items.filter(i => i.status === 'in_stock').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        Low Stock
                      </span>
                      <Badge variant="secondary">
                        {items.filter(i => i.status === 'low_stock').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        Out of Stock
                      </span>
                      <Badge variant="secondary">
                        {items.filter(i => i.status === 'out_of_stock').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new item to the inventory system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input
                  id="partNumber"
                  value={newItem.partNumber}
                  onChange={(e) => setNewItem({ ...newItem, partNumber: e.target.value })}
                  placeholder="Enter part number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newItem.category} onValueChange={(value: InventoryCategory) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub Category</Label>
                <Input
                  id="subCategory"
                  value={newItem.subCategory}
                  onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })}
                  placeholder="Enter sub category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock *</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point *</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  value={newItem.reorderPoint}
                  onChange={(e) => setNewItem({ ...newItem, reorderPoint: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  placeholder="Storage location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipId">Ship ID *</Label>
                <Input
                  id="shipId"
                  value={newItem.shipId}
                  onChange={(e) => setNewItem({ ...newItem, shipId: e.target.value })}
                  placeholder="Enter ship ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={newItem.unitCost}
                  onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update the inventory item details.
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPartNumber">Part Number *</Label>
                  <Input
                    id="editPartNumber"
                    value={editingItem.partNumber || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, partNumber: e.target.value })}
                    placeholder="Enter part number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editName">Name *</Label>
                  <Input
                    id="editName"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Category *</Label>
                  <Select value={editingItem.category} onValueChange={(value: InventoryCategory) => setEditingItem({ ...editingItem, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVENTORY_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSubCategory">Sub Category</Label>
                  <Input
                    id="editSubCategory"
                    value={editingItem.subCategory || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, subCategory: e.target.value })}
                    placeholder="Enter sub category"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editQuantity">Quantity *</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={editingItem.quantity || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUnit">Unit *</Label>
                  <Select value={editingItem.unit} onValueChange={(value) => setEditingItem({ ...editingItem, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMinStock">Minimum Stock *</Label>
                  <Input
                    id="editMinStock"
                    type="number"
                    value={editingItem.minStock || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editReorderPoint">Reorder Point *</Label>
                  <Input
                    id="editReorderPoint"
                    type="number"
                    value={editingItem.reorderPoint || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location *</Label>
                  <Input
                    id="editLocation"
                    value={editingItem.location || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    placeholder="Storage location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplier">Supplier</Label>
                  <Input
                    id="editSupplier"
                    value={editingItem.supplier || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUnitCost">Unit Cost</Label>
                  <Input
                    id="editUnitCost"
                    type="number"
                    step="0.01"
                    value={editingItem.unitCost || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea
                    id="editNotes"
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditItem}>
                Update Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Item Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inventory Item Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Part Number</Label>
                    <p className="text-lg font-semibold">{selectedItem.partNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Name</Label>
                    <p className="text-lg font-semibold">{selectedItem.name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-slate-600">Description</Label>
                    <p className="text-sm text-slate-800">{selectedItem.description || 'No description'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Category</Label>
                    <p className="text-sm">
                      <Badge variant="outline">
                        {INVENTORY_CATEGORIES.find(c => c.value === selectedItem.category)?.label || selectedItem.category}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Status</Label>
                    <p className="text-sm">{getStatusBadge(selectedItem.status)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Current Quantity</Label>
                    <p className="text-lg font-semibold">{selectedItem.quantity} {selectedItem.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Minimum Stock</Label>
                    <p className="text-sm">{selectedItem.minStock} {selectedItem.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Reorder Point</Label>
                    <p className="text-sm">{selectedItem.reorderPoint} {selectedItem.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Location</Label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedItem.location}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Supplier</Label>
                    <p className="text-sm">{selectedItem.supplier || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Unit Cost</Label>
                    <p className="text-sm">${(selectedItem.unitCost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Total Value</Label>
                    <p className="text-lg font-semibold text-green-600">${(selectedItem.totalValue || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                    <p className="text-sm">{format(selectedItem.lastUpdated, 'PPp')}</p>
                  </div>
                  {selectedItem.notes && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-slate-600">Notes</Label>
                      <p className="text-sm text-slate-800">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock Update Dialog */}
        <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
              <DialogDescription>
                {selectedItem && `Current stock: ${selectedItem.quantity} ${selectedItem.unit}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={stockUpdate.type} onValueChange={(value: any) => setStockUpdate({ ...stockUpdate, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, reason: e.target.value })}
                  placeholder="Reason for stock update"
                />
              </div>
              <div className="space-y-2">
                <Label>Reference (Optional)</Label>
                <Input
                  value={stockUpdate.reference}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, reference: e.target.value })}
                  placeholder="Reference number, requisition ID, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStockUpdate}>
                Update Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock Movements Dialog */}
        <Dialog open={movementsDialogOpen} onOpenChange={setMovementsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Movement History</DialogTitle>
              <DialogDescription>
                {selectedItem && `Transaction history for ${selectedItem.name} (${selectedItem.partNumber})`}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No stock movements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{format(movement.date, 'PPp')}</TableCell>
                        <TableCell>
                          <Badge variant={movement.type === 'in' ? 'default' : movement.type === 'out' ? 'destructive' : 'secondary'}>
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.previousQuantity}</TableCell>
                        <TableCell>{movement.newQuantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.reference || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => setMovementsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
