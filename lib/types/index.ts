// Global Ship and Crew Management System Types

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
  lastLogin?: Date
}

export type UserRole = 'admin' | 'fleet_manager' | 'captain' | 'crew' | 'port_agent'

export interface Ship {
  id: string
  name: string
  imo: string
  flag: string
  type: ShipType
  status: ShipStatus
  location: {
    lat: number
    lng: number
    port?: string
    lastUpdate: Date
  }
  specifications: {
    length: number
    beam: number
    draft: number
    deadweight: number
    grossTonnage: number
    yearBuilt: number
  }
  crew: CrewMember[]
  certificates: Certificate[]
  inventory: InventoryItem[]
  requisitions: Requisition[]
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
}

export type ShipType = 'container' | 'bulk_carrier' | 'tanker' | 'cargo' | 'passenger' | 'offshore'
export type ShipStatus = 'at_sea' | 'in_port' | 'anchored' | 'maintenance' | 'emergency'

export interface CrewMember {
  id: string
  name: string
  rank: string
  nationality: string
  documents: Document[]
  joinDate: Date
  contractEnd: Date
  shipId?: string
  status: CrewStatus
  contact: {
    email: string
    phone: string
    emergencyContact: string
  }
  certifications: Certification[]
  schedule: Schedule[]
}

export type CrewStatus = 'active' | 'on_leave' | 'standby' | 'medical' | 'terminated'

export interface Certificate {
  id: string
  name: string
  type: CertificateType
  issueDate: Date
  expiryDate: Date
  issuingAuthority: string
  documentUrl?: string
  status: CertificateStatus
}

export type CertificateType = 'safety' | 'environmental' | 'classification' | 'port_state' | 'insurance'
export type CertificateStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal'

export interface InventoryItem {
  id: string
  partNumber: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  location: string
  shipId: string
  supplier?: string
  lastUpdated: Date
}

export interface Requisition {
  id: string
  type: RequisitionType
  shipId: string
  requestedBy: string
  items: RequisitionItem[]
  status: RequisitionStatus
  priority: Priority
  requestDate: Date
  requiredDate?: Date
  approvedBy?: string
  approvedDate?: Date
  notes?: string
}

export type RequisitionType = 'material' | 'service' | 'spare_parts' | 'provisions'
export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface RequisitionItem {
  id: string
  partNumber?: string
  description: string
  quantity: number
  unit: string
  estimatedCost?: number
  supplier?: string
  notes?: string
}

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  assignedTo: string[]
  shipId: string
  status: TaskStatus
  priority: Priority
  dueDate?: Date
  createdDate: Date
  completedDate?: Date
  estimatedHours?: number
  actualHours?: number
}

export type TaskType = 'maintenance' | 'inspection' | 'repair' | 'administrative' | 'safety_drill'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'

export interface Schedule {
  id: string
  crewMemberId: string
  shipId: string
  startDate: Date
  endDate: Date
  position: string
  notes?: string
}

export interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadDate: Date
  expiryDate?: Date
}

export interface Certification {
  id: string
  name: string
  issuingBody: string
  issueDate: Date
  expiryDate: Date
  documentUrl?: string
}

export interface DashboardStats {
  totalShips: number
  activeCrew: number
  pendingRequisitions: number
  tasksToday: number
  shipsAtSea: number
  shipsInPort: number
  certificatesExpiringSoon: number
  overdueMaintenances: number
}
