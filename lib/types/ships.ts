// Ship Management Types

export type ShipStatus = 'at_sea' | 'in_port' | 'anchored' | 'maintenance' | 'emergency';
export type ShipType = 'container' | 'bulk_carrier' | 'tanker' | 'cargo' | 'passenger' | 'offshore';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RequisitionStatus = 'pending' | 'approved' | 'ordered' | 'delivered' | 'rejected';
export type RequisitionType = 'material' | 'service';
export type CertificateStatus = 'valid' | 'expiring_soon' | 'expired';

export interface ShipLocation {
  lat: number;
  lng: number;
  port?: string;
  lastPort?: string; // Previous port if not currently in port
  country?: string;
  lastUpdate: Date;
}

export interface ShipSpecifications {
  length: number;
  beam: number;
  draft: number;
  deadweight: number;
  grossTonnage: number;
  netTonnage?: number;
  yearBuilt: number;
  builder?: string;
  classificationSociety?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  rank: string;
  nationality: string;
  joinDate: Date;
  contractEndDate?: Date;
  certificates: string[];
  contact: {
    email?: string;
    phone?: string;
    emergencyContact?: string;
  };
  status: 'active' | 'on_leave' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  name: string;
  type: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  certificateNumber: string;
  status: CertificateStatus;
  documentUrl?: string;
  reminderDays: number; // Days before expiry to send reminder
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  manufacturer?: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  unitPrice?: number;
  location: string; // Storage location on ship
  lastStockUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requisition {
  id: string;
  type: RequisitionType;
  requestedBy: string; // User ID
  requestDate: Date;
  requiredDate: Date;
  status: RequisitionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: RequisitionItem[];
  notes?: string;
  approvedBy?: string; // User ID
  approvalDate?: Date;
  rejectionReason?: string;
  totalCost?: number;
  supplier?: string;
  orderNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequisitionItem {
  id: string;
  partNumber?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  actualPrice?: number;
  specification?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // User ID or crew member ID
  assignedBy: string; // User ID
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TaskStatus;
  category: string;
  department?: string;
  estimatedHours?: number;
  actualHours?: number;
  completionNotes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Ship {
  id: string;
  name: string;
  imo: string;
  mmsi?: string;
  callSign?: string;
  flag: string;
  type: ShipType;
  status: ShipStatus;
  location: ShipLocation;
  specifications: ShipSpecifications;
  capacity?: number; // Ship capacity (tons, TEU, passengers, etc.)
  assignedCrewIds?: string[]; // Array of crew member IDs assigned to this ship
  description?: string; // Additional ship description
  companyId: string; // Company that owns this ship
  imageUrl?: string; // URL of ship image in Firebase Storage
  
  // Related data
  crew: CrewMember[];
  certificates: Certificate[];
  inventory: InventoryItem[];
  requisitions: Requisition[];
  tasks: Task[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}

// API Response Types
export interface ShipFormData {
  name: string;
  imo: string;
  mmsi?: string;
  callSign?: string;
  flag: string;
  type: ShipType;
  status: ShipStatus;
  location: {
    port?: string;
    country?: string;
  };
  specifications: Omit<ShipSpecifications, 'yearBuilt'> & { yearBuilt: string };
}

export interface CreateShipRequest extends Omit<Ship, 'id' | 'crew' | 'certificates' | 'inventory' | 'requisitions' | 'tasks' | 'createdAt' | 'updatedAt' | 'companyId' | 'createdBy'> {}

export interface UpdateShipRequest extends Partial<CreateShipRequest> {}

export interface ShipStats {
  totalShips: number;
  byStatus: Record<ShipStatus, number>;
  byType: Record<ShipType, number>;
  activeTasks: number;
  pendingRequisitions: number;
  expiringCertificates: number;
}
